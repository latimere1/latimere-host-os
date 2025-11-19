// pages/api/referrals/create.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

/**
 * Debug flags – safe to enable in prod, logs go to server logs only.
 */
const debugReferrals = process.env.DEBUG_REFERRAL_INVITES === '1'
const debugEmail = process.env.DEBUG_EMAIL === '1'

/**
 * AppSync configuration (server-side only; NOT the Amplify js config).
 */
const APPSYNC_ENDPOINT = process.env.APPSYNC_GRAPHQL_ENDPOINT
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY

/**
 * Email configuration
 *
 * CONTACT_DELIVERY_MODE is what we use to toggle SES on/off for
 * backend routes. Your Amplify env now has CONTACT_DELIVERY_MODE=ses.
 */
const CONTACT_MODE = process.env.CONTACT_DELIVERY_MODE || ''
const ENABLE_EMAIL =
  CONTACT_MODE.toLowerCase() === 'ses' ||
  CONTACT_MODE.toLowerCase() === 'email' // small convenience

// Reuse the SAME from-address config your existing contact API uses.
const RAW_SES_FROM =
  process.env.SES_FROM ||
  process.env.NEXT_PUBLIC_SES_FROM ||
  process.env.SES_FROM_ADDRESS || // older alias if ever set
  'taylor@latimere.com'

/**
 * Normalize to "Name <email@domain>" but keep whatever you configured if it
 * already has a display name.
 */
const SES_FROM_ADDRESS = RAW_SES_FROM.includes('<')
  ? RAW_SES_FROM
  : `Latimere Hosting <${RAW_SES_FROM}>`

const SES_REGION =
  process.env.SES_REGION ||
  process.env.NEXT_PUBLIC_AWS_REGION ||
  process.env.AWS_REGION ||
  'us-east-1'

if (debugEmail || debugReferrals) {
  // eslint-disable-next-line no-console
  console.log('[referrals/create] email config', {
    CONTACT_MODE,
    ENABLE_EMAIL,
    SES_FROM_ADDRESS,
    SES_REGION,
  })
}

const ses = new SESClient({
  region: SES_REGION,
})

type Referral = {
  id: string
  clientName: string
  clientEmail: string
  realtorName: string
  realtorEmail: string
  source?: string | null
  onboardingStatus?: string | null
  inviteToken?: string | null
  payoutEligible?: boolean | null
  payoutSent?: boolean | null
  payoutMethod?: string | null
}

const CREATE_REFERRAL_FROM_PORTAL = /* GraphQL */ `
  mutation CreateReferralFromPortal($input: CreateReferralInput!) {
    createReferral(input: $input) {
      id
      clientName
      clientEmail
      realtorName
      realtorEmail
      source
      onboardingStatus
      inviteToken
      payoutEligible
      payoutSent
      payoutMethod
      createdAt
      updatedAt
    }
  }
`

async function callAppSync<T>(
  query: string,
  variables: Record<string, any>
): Promise<T> {
  if (!APPSYNC_ENDPOINT || !APPSYNC_API_KEY) {
    throw new Error('AppSync not configured')
  }

  const startedAt = Date.now()

  const resp = await fetch(APPSYNC_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': APPSYNC_API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  })

  const json = await resp.json().catch(() => ({}))

  if (!resp.ok || (json as any)?.errors) {
    console.error('[referrals/create] AppSync error', {
      status: resp.status,
      errors: (json as any)?.errors,
      variables,
    })
    throw new Error(
      (json as any)?.errors?.[0]?.message || `AppSync error: ${resp.status}`
    )
  }

  if (debugReferrals) {
    // eslint-disable-next-line no-console
    console.log('[referrals/create] AppSync success', {
      latencyMs: Date.now() - startedAt,
    })
  }

  return (json as any).data as T
}

async function sendEmail(params: {
  to: string[]
  subject: string
  html: string
  text: string
}) {
  if (!ENABLE_EMAIL) {
    if (debugEmail) {
      // eslint-disable-next-line no-console
      console.log('[referrals/create] email disabled, would send', {
        ...params,
        ENABLE_EMAIL,
        SES_FROM_ADDRESS,
      })
    }
    return
  }

  if (!params.to?.length) {
    console.warn('[referrals/create] sendEmail called with no recipients')
    return
  }

  const command = new SendEmailCommand({
    Source: SES_FROM_ADDRESS,
    Destination: { ToAddresses: params.to },
    Message: {
      Subject: { Data: params.subject },
      Body: {
        Text: { Data: params.text },
        Html: { Data: params.html },
      },
    },
  })

  const startedAt = Date.now()
  const resp = await ses.send(command)

  if (debugEmail) {
    // eslint-disable-next-line no-console
    console.log('[referrals/create] email sent', {
      messageId: resp.MessageId,
      to: params.to,
      latencyMs: Date.now() - startedAt,
    })
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!APPSYNC_ENDPOINT || !APPSYNC_API_KEY) {
    console.error(
      '[referrals/create] Missing AppSync env',
      !!APPSYNC_ENDPOINT,
      !!APPSYNC_API_KEY
    )
    return res.status(500).json({ error: 'Server not configured' })
  }

  const {
    realtorName,
    realtorEmail,
    clientName,
    clientEmail,
    notes,
    source,
  } = req.body || {}

  if (!realtorName || !realtorEmail || !clientName || !clientEmail) {
    return res.status(400).json({
      error:
        'Missing required fields: realtorName, realtorEmail, clientName, clientEmail',
    })
  }

  const normalizedRealtorEmail = String(realtorEmail).trim().toLowerCase()
  const normalizedClientEmail = String(clientEmail).trim().toLowerCase()

  // Generate magic token for host onboarding
  const inviteToken =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) +
        Math.random().toString(36).slice(2)

  const normalizedSource = source || 'realtor'

  if (debugReferrals) {
    // eslint-disable-next-line no-console
    console.log('[referrals/create] creating referral', {
      realtorName,
      normalizedRealtorEmail,
      clientName,
      normalizedClientEmail,
      normalizedSource,
      inviteToken,
    })
  }

  try {
    // 1) Create referral in AppSync
    const input: Record<string, any> = {
      clientName,
      clientEmail: normalizedClientEmail,
      realtorName,
      realtorEmail: normalizedRealtorEmail,
      source: normalizedSource,
      onboardingStatus: 'INVITED',
      inviteToken,
      payoutEligible: false,
      payoutSent: false,
    }

    if (debugReferrals) {
      // eslint-disable-next-line no-console
      console.log('[referrals/create] AppSync create input', input)
    }

    type CreateResp = {
      createReferral: Referral
    }

    const data = await callAppSync<CreateResp>(CREATE_REFERRAL_FROM_PORTAL, {
      input,
    })
    const referral = data.createReferral

    if (!referral) {
      throw new Error('Referral create returned no data')
    }

    if (debugReferrals) {
      // eslint-disable-next-line no-console
      console.log('[referrals/create] created referral', {
        id: referral.id,
        inviteToken: referral.inviteToken || inviteToken,
        onboardingStatus: referral.onboardingStatus,
      })
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://www.latimere.com')

    const onboardingUrl = `${siteUrl}/onboarding/${inviteToken}`
    const statusUrlBase = `${siteUrl}/refer/status`
    const statusUrl = `${statusUrlBase}?email=${encodeURIComponent(
      normalizedRealtorEmail
    )}`

    const contactEmail =
      process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'taylor@latimere.com'

    // 2a) Host invite email
    await sendEmail({
      to: [normalizedClientEmail],
      subject: `You’ve been referred to Latimere Hosting by ${realtorName}`,
      text: `Hi ${clientName},

You were referred to Latimere Hosting by ${realtorName}.

We specialize in high-performance short-term rental management in the Smoky Mountains, and we’d love to help you maximize your property’s earnings.

To get started, click the link below to complete a quick onboarding:
${onboardingUrl}

If you have any questions before getting started, just reply to this email.

— The Latimere Hosting Team`,
      html: `
        <p>Hi ${clientName},</p>
        <p>
          You were referred to <strong>Latimere Hosting</strong> by ${realtorName}.
        </p>
        <p>
          We specialize in high-performance short-term rental management in the Smoky Mountains, and we’d love to help you maximize your property’s earnings.
        </p>
        <p>To get started, click the link below to complete a quick onboarding:</p>
        <p><a href="${onboardingUrl}">Start your Latimere onboarding</a></p>
        <p>If you have any questions before getting started, just reply to this email.</p>
        <p>— The Latimere Hosting Team</p>
      `,
    })

    // 2b) Realtor confirmation email
    await sendEmail({
      to: [normalizedRealtorEmail],
      subject: `We’ve received your referral: ${clientName}`,
      text: `Hi ${realtorName},

Thanks for referring ${clientName} to Latimere Hosting.

We’ve sent them an invite to start onboarding and will reach out to walk through pricing, setup, and go-live timing.

You can always check high-level progress for your referrals here:
${statusUrl}

${notes ? `Notes you shared:\n${notes}\n\n` : ''}Thanks again for trusting us with your clients.

— Latimere Hosting`,
      html: `
        <p>Hi ${realtorName},</p>
        <p>Thanks for referring <strong>${clientName}</strong> to Latimere Hosting.</p>
        <p>We’ve sent them an invite to start onboarding and will reach out to walk through pricing, setup, and go-live timing.</p>
        <p>
          You can always check high-level progress for your referrals here:<br/>
          <a href="${statusUrl}">${statusUrl}</a>
        </p>
        ${
          notes
            ? `<p><strong>Notes you shared:</strong><br/>${notes
                .toString()
                .replace(/\n/g, '<br/>')}</p>`
            : ''
        }
        <p>Thanks again for trusting us with your clients.</p>
        <p>— Latimere Hosting</p>
      `,
    })

    // 2c) Internal notification to you
    await sendEmail({
      to: [contactEmail],
      subject: `New referral from ${realtorName}: ${clientName}`,
      text: `New referral created.

Client: ${clientName} (${normalizedClientEmail})
Realtor: ${realtorName} (${normalizedRealtorEmail})
Source: ${normalizedSource}

Onboarding link: ${onboardingUrl}
Realtor status page: ${statusUrl}

Notes:
${notes || '(none provided)'}

Referral id: ${referral.id}
`,
      html: `
        <p><strong>New referral created.</strong></p>
        <p>
          <strong>Client:</strong> ${clientName} (${normalizedClientEmail})<br/>
          <strong>Realtor:</strong> ${realtorName} (${normalizedRealtorEmail})<br/>
          <strong>Source:</strong> ${normalizedSource}
        </p>
        <p>
          <strong>Onboarding link:</strong><br/>
          <a href="${onboardingUrl}">${onboardingUrl}</a><br/>
          <strong>Realtor status page:</strong><br/>
          <a href="${statusUrl}">${statusUrl}</a>
        </p>
        <p>
          <strong>Notes:</strong><br/>
          <pre style="white-space:pre-wrap;font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${
            notes || '(none provided)'
          }</pre>
        </p>
        <p>Referral id: ${referral.id}</p>
      `,
    })

    if (debugReferrals) {
      // eslint-disable-next-line no-console
      console.log('[referrals/create] finished successfully', {
        referralId: referral.id,
        inviteToken: referral.inviteToken || inviteToken,
      })
    }

    return res.status(200).json({
      referral,
      onboardingUrl,
    })
  } catch (err: any) {
    console.error('[referrals/create] unexpected error', err)
    return res
      .status(500)
      .json({ error: err?.message || 'Failed to create referral' })
  }
}

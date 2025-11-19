// pages/api/referrals/create.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

/**
 * Debug flags – server logs only.
 */
const debugReferrals = process.env.DEBUG_REFERRAL_INVITES === '1'
const debugEmail = process.env.DEBUG_EMAIL === '1'

/**
 * Helper: load AppSync config at REQUEST TIME, not module load.
 * This avoids any oddities with build-time env injection.
 */
function getAppSyncConfig() {
  let endpoint = process.env.APPSYNC_GRAPHQL_ENDPOINT || ''
  let apiKey = process.env.APPSYNC_API_KEY || ''

  // Best-effort fallback: try to read from NEXT_PUBLIC_AMPLIFY_JSON
  if ((!endpoint || !apiKey) && process.env.NEXT_PUBLIC_AMPLIFY_JSON) {
    try {
      const cfg = JSON.parse(process.env.NEXT_PUBLIC_AMPLIFY_JSON)
      endpoint = endpoint || cfg.aws_appsync_graphqlEndpoint || ''
      // NOTE: you currently don't have aws_appsync_apiKey in that JSON,
      // but if you ever add it, this will pick it up:
      apiKey = apiKey || cfg.aws_appsync_apiKey || ''
    } catch (err) {
      console.error('[referrals/create] Failed to parse NEXT_PUBLIC_AMPLIFY_JSON', err)
    }
  }

  return { endpoint, apiKey }
}

/**
 * Email configuration
 */
const CONTACT_MODE = (process.env.CONTACT_DELIVERY_MODE || '').toLowerCase()
const EMAIL_FEATURE_ENABLED =
  process.env.EMAIL_FEATURE_ENABLED === 'true' ||
  process.env.EMAIL_FEATURE_ENABLED === '1'

const ENABLE_EMAIL =
  (CONTACT_MODE === 'ses' || CONTACT_MODE === 'email') && EMAIL_FEATURE_ENABLED

const RAW_SES_FROM =
  process.env.SES_FROM ||
  process.env.NEXT_PUBLIC_SES_FROM ||
  process.env.SES_FROM_ADDRESS ||
  'taylor@latimere.com'

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
  console.log('[referrals/create] startup config', {
    CONTACT_MODE,
    EMAIL_FEATURE_ENABLED,
    ENABLE_EMAIL,
    SES_FROM_ADDRESS,
    SES_REGION,
    hasAppSyncEndpoint: !!process.env.APPSYNC_GRAPHQL_ENDPOINT,
    hasAppSyncApiKey: !!process.env.APPSYNC_API_KEY,
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
  const { endpoint, apiKey } = getAppSyncConfig()

  if (!endpoint || !apiKey) {
    console.error('[referrals/create] AppSync not configured in callAppSync', {
      hasEndpoint: !!endpoint,
      hasApiKey: !!apiKey,
    })
    throw new Error('AppSync not configured')
  }

  const startedAt = Date.now()

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
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

  // Re-read env vars *inside* the handler
  const { endpoint, apiKey } = getAppSyncConfig()

  if (!endpoint || !apiKey) {
    const missing: string[] = []
    if (!endpoint) missing.push('APPSYNC_GRAPHQL_ENDPOINT')
    if (!apiKey) missing.push('APPSYNC_API_KEY')

    console.error('[referrals/create] Missing AppSync env in handler', {
      hasEndpoint: !!endpoint,
      hasApiKey: !!apiKey,
      missing,
      // DO NOT log the actual key value for security
    })

    return res.status(500).json({
      error: 'Server not configured',
      missingEnv: missing,
    })
  }

  const {
    realtorName,
    realtorEmail,
    clientName,
    clientEmail,
    notes,
    source,
  } = (req.body || {}) as {
    realtorName?: string
    realtorEmail?: string
    clientName?: string
    clientEmail?: string
    notes?: string
    source?: string
  }

  if (!realtorName || !realtorEmail || !clientName || !clientEmail) {
    return res.status(400).json({
      error:
        'Missing required fields: realtorName, realtorEmail, clientName, clientEmail',
    })
  }

  const normalizedRealtorEmail = String(realtorEmail).trim().toLowerCase()
  const normalizedClientEmail = String(clientEmail).trim().toLowerCase()

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

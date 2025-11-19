// pages/api/referrals/complete.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const debugReferrals = process.env.DEBUG_REFERRAL_INVITES === '1'
const debugEmail = process.env.DEBUG_EMAIL === '1'

const APPSYNC_ENDPOINT = process.env.APPSYNC_GRAPHQL_ENDPOINT
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY

const ENABLE_EMAIL = process.env.CONTACT_DELIVERY_MODE === 'ses'

const ses = new SESClient({
  region: process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1',
})

// IMPORTANT: only use fields that actually exist on your Referral model
const UPDATE_REFERRAL_FROM_ONBOARDING = /* GraphQL */ `
  mutation UpdateReferralFromOnboarding($input: UpdateReferralInput!) {
    updateReferral(input: $input) {
      id
      clientName
      clientEmail
      realtorName
      realtorEmail
      source
      onboardingStatus
      createdAt
      updatedAt
    }
  }
`

type Referral = {
  id: string
  clientName: string
  clientEmail: string
  realtorName: string
  realtorEmail: string
  source?: string | null
  onboardingStatus?: string | null
}

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

  const json = await resp.json()

  if (!resp.ok || json.errors) {
    console.error('[referrals/complete] AppSync error', {
      status: resp.status,
      errors: json.errors,
      variables,
    })
    throw new Error(
      json?.errors?.[0]?.message || `AppSync error: ${resp.status}`
    )
  }

  if (debugReferrals) {
    // eslint-disable-next-line no-console
    console.log('[referrals/complete] AppSync success', {
      latencyMs: Date.now() - startedAt,
    })
  }

  return json.data as T
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
      console.log('[referrals/complete] email disabled, would send', params)
    }
    return
  }

  const source =
    process.env.SES_FROM_ADDRESS || 'Latimere Hosting <no-reply@latimere.com>'

  const command = new SendEmailCommand({
    Source: source,
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
    console.log('[referrals/complete] email sent', {
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
      '[referrals/complete] Missing AppSync env',
      !!APPSYNC_ENDPOINT,
      !!APPSYNC_API_KEY
    )
    return res.status(500).json({ error: 'Server not configured' })
  }

  const {
    referralId,
    inviteToken,
    phone,
    propertyAddress,
    sleeps,
    listedStatus,
    timeline,
    notes,
  } = req.body || {}

  if (!referralId) {
    return res.status(400).json({ error: 'Missing referralId' })
  }

  if (debugReferrals) {
    // eslint-disable-next-line no-console
    console.log('[referrals/complete] incoming payload', {
      referralId,
      hasInviteToken: !!inviteToken,
      phone,
      propertyAddress,
      sleeps,
      listedStatus,
      timeline,
    })
  }

  try {
    // 1) Update referral in AppSync – only fields that exist in schema
    const input: Record<string, any> = {
      id: referralId,
      onboardingStatus: 'ONBOARDING_SUBMITTED',
    }

    type UpdateResp = {
      updateReferral: Referral
    }

    const data = await callAppSync<UpdateResp>(
      UPDATE_REFERRAL_FROM_ONBOARDING,
      { input }
    )

    const updated = data.updateReferral

    if (!updated) {
      throw new Error('Referral update returned no data')
    }

    if (debugReferrals) {
      // eslint-disable-next-line no-console
      console.log('[referrals/complete] updated referral', {
        id: updated.id,
        onboardingStatus: updated.onboardingStatus,
      })
    }

    // 2) Emails (host, realtor, you) – we still use the request body
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://www.latimere.com'
    const adminUrl = `${siteUrl}/admin/referrals`
    const statusUrl = `${siteUrl}/refer/status`

    const contactEmail =
      process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'taylor@latimere.com'

    const clientName = updated.clientName || 'your client'
    const realtorName = updated.realtorName || 'your realtor'
    const sourceLabel = updated.source || 'realtor'

    // Host confirmation
    if (updated.clientEmail) {
      await sendEmail({
        to: [updated.clientEmail],
        subject:
          'Thanks for sharing your property details with Latimere Hosting',
        text: `Hi ${updated.clientName || ''},

Thanks for taking a few minutes to tell us about your property.

We’ll review everything and reach out soon to walk through pricing, strategy, and next steps.

If you have any questions in the meantime, just reply to this email.

— The Latimere Hosting Team`,
        html: `
          <p>Hi ${updated.clientName || ''},</p>
          <p>Thanks for taking a few minutes to tell us about your property.</p>
          <p>We’ll review everything and reach out soon to walk through pricing, strategy, and next steps.</p>
          <p>If you have any questions in the meantime, just reply to this email.</p>
          <p>— The Latimere Hosting Team</p>
        `,
      })
    }

    // Realtor update
    if (updated.realtorEmail) {
      await sendEmail({
        to: [updated.realtorEmail],
        subject: `${clientName} just completed their first onboarding step with Latimere`,
        text: `Hi ${realtorName},

Good news — your referral ${clientName} just completed the first step of onboarding with Latimere Hosting.

We’ll now review their property details and work with them on pricing, setup, and go-live timing.

You can always check high-level progress for your referrals at:
${statusUrl}

Thanks again for trusting us with your clients.

— Latimere Hosting`,
        html: `
          <p>Hi ${realtorName},</p>
          <p>Good news — your referral <strong>${clientName}</strong> just completed the first step of onboarding with Latimere Hosting.</p>
          <p>We’ll now review their property details and work with them on pricing, setup, and go-live timing.</p>
          <p>You can always check high-level progress for your referrals here:<br/>
            <a href="${statusUrl}">${statusUrl}</a>
          </p>
          <p>Thanks again for trusting us with your clients.</p>
          <p>— Latimere Hosting</p>
        `,
      })
    }

    // Internal notification to you
    await sendEmail({
      to: [contactEmail],
      subject: `New onboarding submission: ${clientName} (referred by ${realtorName})`,
      text: `Summary:

Client: ${updated.clientName || 'N/A'} (${updated.clientEmail || 'no email'})
Realtor: ${updated.realtorName || 'N/A'} (${updated.realtorEmail || 'no email'})
Source: ${sourceLabel}

Phone: ${phone || 'N/A'}
Address: ${propertyAddress || 'N/A'}
Sleeps: ${sleeps || 'N/A'}
Previously listed: ${listedStatus || 'N/A'}
Timeline: ${timeline || 'N/A'}

Notes:
${notes || '(none provided)'}

View in admin: ${adminUrl}
Realtor status page: ${statusUrl}
`,
      html: `
        <p><strong>New onboarding submission received.</strong></p>
        <p>
          <strong>Client:</strong> ${updated.clientName || 'N/A'} (${
        updated.clientEmail || 'no email'
      })<br/>
          <strong>Realtor:</strong> ${updated.realtorName || 'N/A'} (${
        updated.realtorEmail || 'no email'
      })<br/>
          <strong>Source:</strong> ${sourceLabel}
        </p>
        <p>
          <strong>Phone:</strong> ${phone || 'N/A'}<br/>
          <strong>Address:</strong> ${propertyAddress || 'N/A'}<br/>
          <strong>Sleeps:</strong> ${sleeps || 'N/A'}<br/>
          <strong>Previously listed:</strong> ${
            listedStatus || 'N/A'
          }<br/>
          <strong>Timeline:</strong> ${timeline || 'N/A'}
        </p>
        <p>
          <strong>Notes:</strong><br/>
          <pre style="white-space:pre-wrap;font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${
            notes || '(none provided)'
          }</pre>
        </p>
        <p>
          <a href="${adminUrl}">Open referral admin</a><br/>
          <a href="${statusUrl}">Realtor status page</a>
        </p>
      `,
    })

    return res.status(200).json({ referral: updated })
  } catch (err: any) {
    console.error('[referrals/complete] unexpected error', err)
    return res
      .status(500)
      .json({ error: err?.message || 'Failed to complete onboarding' })
  }
}

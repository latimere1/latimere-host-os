// pages/api/admin/referrals/update.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const APPSYNC_ENDPOINT = process.env.APPSYNC_GRAPHQL_ENDPOINT
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY

const debugReferrals = process.env.DEBUG_REFERRAL_INVITES === '1'
const debugEmail = process.env.DEBUG_EMAIL === '1'
const ENABLE_EMAIL = process.env.CONTACT_DELIVERY_MODE === 'ses'

const ses = new SESClient({
  region: process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1',
})

type Referral = {
  id: string
  clientName: string
  clientEmail: string
  realtorName: string
  realtorEmail: string
  source?: string | null
  onboardingStatus?: string | null
  payoutEligible?: boolean | null
  payoutSent?: boolean | null
  payoutMethod?: string | null
}

const GET_REFERRAL_FOR_ADMIN = /* GraphQL */ `
  query GetReferralForAdmin($id: ID!) {
    getReferral(id: $id) {
      id
      clientName
      clientEmail
      realtorName
      realtorEmail
      source
      onboardingStatus
      payoutEligible
      payoutSent
      payoutMethod
    }
  }
`

const UPDATE_REFERRAL_ADMIN = /* GraphQL */ `
  mutation UpdateReferralAdmin($input: UpdateReferralInput!) {
    updateReferral(input: $input) {
      id
      clientName
      clientEmail
      realtorName
      realtorEmail
      source
      onboardingStatus
      payoutEligible
      payoutSent
      payoutMethod
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

  const json = await resp.json()

  if (!resp.ok || json.errors) {
    console.error('[admin/referrals/update] AppSync error', {
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
    console.log('[admin/referrals/update] AppSync success', {
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
      console.log('[admin/referrals/update] email disabled, would send', params)
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
    console.log('[admin/referrals/update] email sent', {
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
      '[admin/referrals/update] Missing AppSync env',
      !!APPSYNC_ENDPOINT,
      !!APPSYNC_API_KEY
    )
    return res.status(500).json({ error: 'Server not configured' })
  }

  const { id, onboardingStatus, payoutEligible, payoutSent, payoutMethod } =
    req.body || {}

  if (!id) {
    return res.status(400).json({ error: 'Missing referral id' })
  }

  try {
    // 1) Load existing referral to detect transitions
    type GetResp = { getReferral: Referral | null }
    const beforeData = await callAppSync<GetResp>(GET_REFERRAL_FOR_ADMIN, { id })
    const before = beforeData.getReferral

    if (!before) {
      return res.status(404).json({ error: 'Referral not found' })
    }

    // Build minimal update payload
    const input: Record<string, any> = { id }

    if (typeof onboardingStatus === 'string') {
      input.onboardingStatus = onboardingStatus
    }
    if (typeof payoutEligible === 'boolean') {
      input.payoutEligible = payoutEligible
    }
    if (typeof payoutSent === 'boolean') {
      input.payoutSent = payoutSent
    }
    if (typeof payoutMethod === 'string') {
      input.payoutMethod = payoutMethod
    }

    if (debugReferrals) {
      // eslint-disable-next-line no-console
      console.log('[admin/referrals/update] updating referral', input)
    }

    // 2) Persist update
    type UpdateResp = { updateReferral: Referral }
    const afterData = await callAppSync<UpdateResp>(UPDATE_REFERRAL_ADMIN, {
      input,
    })
    const after = afterData.updateReferral

    if (!after) {
      throw new Error('Update returned no referral')
    }

    if (debugReferrals) {
      // eslint-disable-next-line no-console
      console.log('[admin/referrals/update] updated referral', {
        id: after.id,
        onboardingStatus: after.onboardingStatus,
        payoutEligible: after.payoutEligible,
        payoutSent: after.payoutSent,
      })
    }

    // 3) Trigger emails based on state changes
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://www.latimere.com')

    const statusUrlBase = `${siteUrl}/refer/status`
    const realtorEmailRaw = after.realtorEmail
    const realtorEmail = realtorEmailRaw
      ? realtorEmailRaw.trim().toLowerCase()
      : ''

    const statusUrl = realtorEmail
      ? `${statusUrlBase}?email=${encodeURIComponent(realtorEmail)}`
      : statusUrlBase

    const clientName = after.clientName || 'your client'
    const realtorName = after.realtorName || 'your realtor'

    const beforeStatus = (before.onboardingStatus || '').toUpperCase()
    const afterStatus = (after.onboardingStatus || '').toUpperCase()
    const beforePaid = !!before.payoutSent
    const afterPaid = !!after.payoutSent

    // a) Onboarding completed -> realtor notification
    if (
      realtorEmail &&
      beforeStatus !== 'COMPLETED' &&
      afterStatus === 'COMPLETED'
    ) {
      await sendEmail({
        to: [realtorEmail],
        subject: `${clientName} is fully onboarded with Latimere`,
        text: `Hi ${realtorName},

Great news — your referral ${clientName} is now fully onboarded with Latimere Hosting.

We’ll coordinate go-live timing and payouts with them. Your $500 referral reward will be sent after their first payout is processed, according to our agreement.

You can always check high-level progress and bonus status here:
${statusUrl}

Thanks again for trusting us with your clients.

— Latimere Hosting`,
        html: `
          <p>Hi ${realtorName},</p>
          <p>
            Great news — your referral <strong>${clientName}</strong> is now
            fully onboarded with Latimere Hosting.
          </p>
          <p>
            We’ll coordinate go-live timing and payouts with them. Your $500
            referral reward will be sent after their first payout is processed,
            according to our agreement.
          </p>
          <p>
            You can always check high-level progress and bonus status here:<br/>
            <a href="${statusUrl}">${statusUrl}</a>
          </p>
          <p>Thanks again for trusting us with your clients.</p>
          <p>— Latimere Hosting</p>
        `,
      })
    }

    // b) Bonus marked as paid -> realtor payout confirmation
    if (realtorEmail && !beforePaid && afterPaid) {
      await sendEmail({
        to: [realtorEmail],
        subject: `Your Latimere referral bonus for ${clientName} has been sent`,
        text: `Hi ${realtorName},

We’ve just sent your referral bonus for ${clientName}. Thank you again for trusting us with your clients.

If you don’t see the funds within a reasonable timeframe, reply to this email and we’ll look into it.

— Latimere Hosting`,
        html: `
          <p>Hi ${realtorName},</p>
          <p>
            We’ve just sent your referral bonus for
            <strong>${clientName}</strong>. Thank you again for trusting us
            with your clients.
          </p>
          <p>
            If you don’t see the funds within a reasonable timeframe, reply to
            this email and we’ll look into it.
          </p>
          <p>— Latimere Hosting</p>
        `,
      })
    }

    return res.status(200).json({ referral: after })
  } catch (err: any) {
    console.error('[admin/referrals/update] unexpected error', err)
    return res
      .status(500)
      .json({ error: err?.message || 'Failed to update referral record' })
  }
}

// pages/api/admin/referrals/update.ts
/* eslint-disable no-console */
import type { NextApiRequest, NextApiResponse } from 'next'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { randomUUID } from 'crypto'

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

const debugReferrals = process.env.DEBUG_REFERRAL_INVITES === '1'
const debugEmail = process.env.DEBUG_EMAIL === '1'
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

// Email feature flags (keep existing semantics)
const CONTACT_MODE =
  process.env.CONTACT_MODE?.toLowerCase() ||
  process.env.CONTACT_DELIVERY_MODE?.toLowerCase() ||
  ''
const RAW_EMAIL_FEATURE =
  (process.env.EMAIL_FEATURE_ENABLED || '').trim().toLowerCase()
const EMAIL_FEATURE_ENABLED =
  RAW_EMAIL_FEATURE === '1' ||
  RAW_EMAIL_FEATURE === 'true' ||
  (RAW_EMAIL_FEATURE === '' && process.env.NODE_ENV === 'production')
const ENABLE_EMAIL =
  (CONTACT_MODE === 'ses' || CONTACT_MODE === 'email') && EMAIL_FEATURE_ENABLED

const ses = new SESClient({
  region: process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1',
})

/* -------------------------------------------------------------------------- */
/* Logging helpers                                                            */
/* -------------------------------------------------------------------------- */

function logDebug(reqId: string, msg: string, data?: unknown) {
  if (debugReferrals || LOG_LEVEL === 'debug') {
    console.log(`[admin/referrals/update][${reqId}] ${msg}`, data ?? '')
  }
}

function logInfo(reqId: string, msg: string, data?: unknown) {
  if (LOG_LEVEL === 'info' || LOG_LEVEL === 'debug') {
    console.log(`[admin/referrals/update][${reqId}] ${msg}`, data ?? '')
  }
}

function logError(reqId: string, msg: string, data?: unknown) {
  console.error(`[admin/referrals/update][${reqId}] ${msg}`, data ?? '')
}

/* -------------------------------------------------------------------------- */
/* Body parser                                                                */
/* -------------------------------------------------------------------------- */

function parseBody(req: NextApiRequest) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body || {}
}

/* -------------------------------------------------------------------------- */
/* AppSync config via NEXT_PUBLIC_AMPLIFY_JSON                                */
/* -------------------------------------------------------------------------- */

function getAppSyncConfig(reqId: string) {
  const raw = process.env.NEXT_PUBLIC_AMPLIFY_JSON
  if (!raw) {
    logError(reqId, 'NEXT_PUBLIC_AMPLIFY_JSON missing in runtime')
    throw new Error('AppSync not configured – missing NEXT_PUBLIC_AMPLIFY_JSON')
  }

  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch (err: any) {
    logError(reqId, 'Invalid NEXT_PUBLIC_AMPLIFY_JSON', { message: err?.message })
    throw new Error('AppSync not configured – invalid NEXT_PUBLIC_AMPLIFY_JSON')
  }

  const endpoint = parsed.aws_appsync_graphqlEndpoint as string | undefined
  const apiKey = parsed.aws_appsync_apiKey as string | undefined

  logDebug(reqId, 'Resolved AppSync config', {
    hasEndpoint: !!endpoint,
    hasApiKey: !!apiKey,
    endpointSample: endpoint?.slice(0, 64),
  })

  if (!endpoint || !apiKey) {
    throw new Error('AppSync not configured – missing endpoint or API key')
  }

  return { endpoint, apiKey }
}

/* -------------------------------------------------------------------------- */
/* AppSync caller                                                             */
/* -------------------------------------------------------------------------- */

async function callAppSync<T>(
  reqId: string,
  query: string,
  variables: Record<string, any>
): Promise<T> {
  const { endpoint, apiKey } = getAppSyncConfig(reqId)

  const startedAt = Date.now()
  logDebug(reqId, 'Calling AppSync', {
    endpointSample: endpoint.slice(0, 60),
    variables,
  })

  let resp: Response
  try {
    resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ query, variables }),
    })
  } catch (networkErr: any) {
    logError(reqId, 'Network error calling AppSync', {
      message: networkErr?.message,
      endpointSample: endpoint.slice(0, 60),
    })
    throw new Error(`AppSync network error: ${networkErr?.message}`)
  }

  const text = await resp.text()
  let json: any = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    logError(reqId, 'Failed to parse AppSync JSON', {
      status: resp.status,
      bodySnippet: text.slice(0, 500),
    })
    throw new Error('Invalid JSON returned from AppSync')
  }

  if (!resp.ok || json.errors) {
    logError(reqId, 'AppSync GraphQL error', {
      status: resp.status,
      statusText: resp.statusText,
      errors: json.errors,
    })
    const first = json.errors?.[0]?.message
    throw new Error(first || 'You are not authorized to make this call.')
  }

  logDebug(reqId, 'AppSync success', { latencyMs: Date.now() - startedAt })
  return json.data as T
}

/* -------------------------------------------------------------------------- */
/* GraphQL queries/mutations                                                  */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* SES email helper                                                           */
/* -------------------------------------------------------------------------- */

async function sendEmail(params: {
  reqId: string
  to: string[]
  subject: string
  html: string
  text: string
}) {
  const { reqId, to, subject, html, text } = params

  if (!ENABLE_EMAIL) {
    if (debugEmail) {
      console.log('[admin/referrals/update] email disabled, would send', {
        to,
        subject,
      })
    }
    return
  }

  if (!to.length) {
    logError(reqId, 'sendEmail called with empty recipient list', { subject })
    return
  }

  const source =
    process.env.SES_FROM_ADDRESS ||
    process.env.SES_FROM ||
    'Latimere Hosting <no-reply@latimere.com>'

  const command = new SendEmailCommand({
    Source: source,
    Destination: { ToAddresses: to },
    Message: {
      Subject: { Data: subject },
      Body: {
        Text: { Data: text },
        Html: { Data: html },
      },
    },
  })

  const startedAt = Date.now()
  const resp = await ses.send(command)

  if (debugEmail || LOG_LEVEL === 'debug') {
    console.log('[admin/referrals/update] email sent', {
      messageId: resp.MessageId,
      to,
      subject,
      latencyMs: Date.now() - startedAt,
    })
  }
}

/* -------------------------------------------------------------------------- */
/* Handler                                                                    */
/* -------------------------------------------------------------------------- */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ referral?: Referral; error?: string }>
) {
  const reqId = randomUUID().slice(0, 8)

  logInfo(reqId, 'Incoming admin update request', {
    method: req.method,
    path: req.url,
    nodeEnv: process.env.NODE_ENV,
  })

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = parseBody(req)
  const { id, onboardingStatus, payoutEligible, payoutSent, payoutMethod } =
    body || {}

  if (!id) {
    return res.status(400).json({ error: 'Missing referral id' })
  }

  try {
    // 1) Load existing referral to detect transitions
    type GetResp = { getReferral: Referral | null }
    const beforeData = await callAppSync<GetResp>(
      reqId,
      GET_REFERRAL_FOR_ADMIN,
      { id }
    )
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

    logDebug(reqId, 'Updating referral with payload', input)

    // 2) Persist update
    type UpdateResp = { updateReferral: Referral }
    const afterData = await callAppSync<UpdateResp>(
      reqId,
      UPDATE_REFERRAL_ADMIN,
      { input }
    )
    const after = afterData.updateReferral

    if (!after) {
      throw new Error('Update returned no referral')
    }

    logInfo(reqId, 'Updated referral', {
      id: after.id,
      onboardingStatus: after.onboardingStatus,
      payoutEligible: after.payoutEligible,
      payoutSent: after.payoutSent,
      payoutMethod: after.payoutMethod,
    })

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
      logDebug(reqId, 'Triggering completion email to realtor', {
        beforeStatus,
        afterStatus,
        realtorEmail,
      })

      await sendEmail({
        reqId,
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
      logDebug(reqId, 'Triggering payout-sent email to realtor', {
        beforePaid,
        afterPaid,
        realtorEmail,
      })

      await sendEmail({
        reqId,
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
    logError(reqId, 'Unexpected error in admin update handler', {
      message: err?.message,
      stack: err?.stack,
    })

    return res.status(500).json({
      error:
        err?.message ||
        'Failed to update referral record (see server logs for details)',
    })
  }
}

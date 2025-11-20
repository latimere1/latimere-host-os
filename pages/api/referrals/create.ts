// pages/api/referrals/create.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { randomUUID } from 'crypto'

/**
 * Debug flags – server logs only.
 */
const DEBUG_REFERRALS = process.env.DEBUG_REFERRAL_INVITES === '1'
const DEBUG_EMAIL = process.env.DEBUG_EMAIL === '1'
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

/**
 * Load AppSync config at request time so local .env changes are picked up.
 */
function getAppSyncConfig() {
  const endpoint =
    process.env.APPSYNC_GRAPHQL_ENDPOINT ||
    process.env.NEXT_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT ||
    ''

  const apiKey =
    process.env.APPSYNC_API_KEY ||
    process.env.NEXT_PUBLIC_APPSYNC_API_KEY ||
    ''

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

const ses = new SESClient({ region: SES_REGION })

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
  notes?: string | null
}

const CREATE_REFERRAL_MUTATION = /* GraphQL */ `
  mutation CreateReferral($input: CreateReferralInput!) {
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
      notes
      createdAt
      updatedAt
    }
  }
`

/**
 * Simple logging helpers with per-request id
 */
function logDebug(reqId: string, msg: string, data?: unknown) {
  if (DEBUG_REFERRALS || LOG_LEVEL === 'debug') {
    // eslint-disable-next-line no-console
    console.log(`[referrals/create][${reqId}] ${msg}`, data ?? '')
  }
}

function logError(reqId: string, msg: string, data?: unknown) {
  console.error(`[referrals/create][${reqId}] ${msg}`, data ?? '')
}

/**
 * REAL APPSYNC CALL (used in dev/prod, skipped on localhost mock mode)
 */
async function callAppSync<T>(
  reqId: string,
  query: string,
  variables: Record<string, any>
): Promise<T> {
  const { endpoint, apiKey } = getAppSyncConfig()

  if (!endpoint || !apiKey) {
    logError(reqId, 'AppSync not configured', {
      endpoint,
      apiKeyExists: Boolean(apiKey),
    })
    throw new Error(
      'AppSync not configured – check APPSYNC_GRAPHQL_ENDPOINT and APPSYNC_API_KEY'
    )
  }

  const startedAt = Date.now()
  logDebug(reqId, 'Calling AppSync', { endpoint, hasApiKey: !!apiKey })

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
    // This is the "fetch failed" case you are seeing locally.
    logError(reqId, 'Network error talking to AppSync', {
      message: networkErr?.message,
      cause: networkErr?.cause,
      endpoint,
    })
    throw new Error(
      `AppSync network error: ${networkErr?.message || 'fetch failed'}`
    )
  }

  const text = await resp.text()
  let json: any = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch (parseErr) {
    logError(reqId, 'Failed to parse AppSync JSON', {
      status: resp.status,
      text,
    })
    throw new Error('Invalid JSON returned from AppSync')
  }

  if (!resp.ok || json.errors) {
    logError(reqId, 'AppSync GraphQL error', {
      status: resp.status,
      statusText: resp.statusText,
      errors: json.errors,
      variables,
    })

    const firstMsg = json.errors?.[0]?.message
    throw new Error(
      firstMsg ||
        `AppSync error – HTTP ${resp.status} ${resp.statusText} (see server logs)`
    )
  }

  logDebug(reqId, 'AppSync success', { latencyMs: Date.now() - startedAt })
  return json.data as T
}

/**
 * Email helper
 */
async function sendEmail(params: {
  reqId: string
  to: string[]
  subject: string
  html: string
  text: string
}) {
  const { reqId, to, subject, html, text } = params

  if (!ENABLE_EMAIL) {
    logDebug(reqId, 'Email disabled – skipping send', {
      to,
      subject,
      CONTACT_MODE,
      EMAIL_FEATURE_ENABLED,
    })
    return
  }

  if (!to?.length) {
    logError(reqId, 'sendEmail called with no recipients', { subject })
    return
  }

  const command = new SendEmailCommand({
    Source: SES_FROM_ADDRESS,
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

  logDebug(reqId, 'Email sent', {
    to,
    subject,
    messageId: resp.MessageId,
    latencyMs: Date.now() - startedAt,
  })
}

/**
 * Normalize body for local/dev where Next sometimes gives string body
 */
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reqId = randomUUID().slice(0, 8)

  logDebug(reqId, 'Incoming request', {
    method: req.method,
    path: req.url,
    env: process.env.NEXT_PUBLIC_ENV,
    nodeEnv: process.env.NODE_ENV,
  })

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = parseBody(req)
  const {
    realtorName,
    realtorEmail,
    clientName,
    clientEmail,
    notes,
    source,
  } = body as {
    realtorName?: string
    realtorEmail?: string
    clientName?: string
    clientEmail?: string
    notes?: string
    source?: string
  }

  if (!realtorName || !realtorEmail || !clientName || !clientEmail) {
    logDebug(reqId, 'Validation failed – missing required fields', body)
    return res.status(400).json({
      error:
        'Missing required fields: realtorName, realtorEmail, clientName, clientEmail',
    })
  }

  const normalizedRealtorEmail = String(realtorEmail).trim().toLowerCase()
  const normalizedClientEmail = String(clientEmail).trim().toLowerCase()
  const inviteToken = randomUUID()
  const normalizedSource = source || 'realtor'

  logDebug(reqId, 'Prepared referral payload', {
    realtorName,
    normalizedRealtorEmail,
    clientName,
    normalizedClientEmail,
    normalizedSource,
    inviteToken,
  })

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://www.latimere.com')

  const onboardingUrl = `${siteUrl}/onboarding/${inviteToken}`
  const statusUrl = `${siteUrl}/refer/status?email=${encodeURIComponent(
    normalizedRealtorEmail
  )}`

  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'taylor@latimere.com'

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
      payoutMethod: null,
      notes: notes || '',
    }

    const isLocalMock =
      process.env.NEXT_PUBLIC_ENV === 'local' &&
      process.env.USE_REAL_APPSYNC_LOCAL !== '1'

    let referral: Referral

    if (isLocalMock) {
      // ──────────────────────────────────────
      // LOCALHOST MOCK MODE (no network call)
      // ──────────────────────────────────────
      referral = {
        id: `local-${Date.now()}`,
        ...input,
      }

      logDebug(reqId, 'LOCAL MODE – mocking AppSync referral create', {
        referral,
      })
    } else {
      // ──────────────────────────────────────
      // REAL APPSYNC CALL (dev/prod)
      // ──────────────────────────────────────
      type CreateResp = { createReferral: Referral }

      const data = await callAppSync<CreateResp>(
        reqId,
        CREATE_REFERRAL_MUTATION,
        { input }
      )
      referral = data.createReferral

      if (!referral) {
        throw new Error('Referral create returned no data')
      }

      logDebug(reqId, 'Referral created via AppSync', {
        id: referral.id,
        inviteToken: referral.inviteToken || inviteToken,
        onboardingStatus: referral.onboardingStatus,
      })
    }

    // ──────────────────────────────────────
    // EMAILS (can still be real even in local)
    // ──────────────────────────────────────

    // Client email
    await sendEmail({
      reqId,
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

    // Referrer email
    await sendEmail({
      reqId,
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

    // Internal notification
    await sendEmail({
      reqId,
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

    logDebug(reqId, 'Finished successfully', {
      referralId: referral.id,
      inviteToken,
      mode: isLocalMock ? 'local-mock' : 'appsync',
    })

    return res.status(200).json({
      ok: true,
      referral,
      onboardingUrl,
      mode: isLocalMock ? 'local-mock' : 'appsync',
    })
  } catch (err: any) {
    logError(reqId, 'Unexpected error in handler', {
      message: err?.message,
      stack: err?.stack,
    })

    return res.status(500).json({
      error:
        err?.message ||
        'Unexpected server error while creating referral (see server logs)',
    })
  }
}

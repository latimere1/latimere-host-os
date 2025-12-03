// pages/api/referrals/create.ts
/* eslint-disable no-console */
import type { NextApiRequest, NextApiResponse } from 'next'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { randomUUID } from 'crypto'

/**
 * Debug / config flags
 */
const DEBUG_REFERRALS = process.env.DEBUG_REFERRAL_INVITES === '1'
const DEBUG_EMAIL = process.env.DEBUG_EMAIL === '1'
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

/**
 * Email configuration
 *
 * We:
 * - Look at CONTACT_MODE and CONTACT_DELIVERY_MODE
 * - Trim and lowercase values
 * - Default CONTACT_MODE to "ses" in production if nothing is set
 * - Treat EMAIL_FEATURE_ENABLED=1/true as ON
 *   and default to ON in production if it’s unset
 */

// Raw env strings (for debugging / logging)
const RAW_CONTACT_MODE =
  process.env.CONTACT_MODE ??
  process.env.CONTACT_DELIVERY_MODE ??
  ''

const RAW_EMAIL_FEATURE = (process.env.EMAIL_FEATURE_ENABLED ?? '').trim().toLowerCase()

// Normalized contact mode
const CONTACT_MODE =
  RAW_CONTACT_MODE.trim().toLowerCase() ||
  (process.env.NODE_ENV === 'production' ? 'ses' : '')

// Normalized feature flag
const EMAIL_FEATURE_ENABLED =
  RAW_EMAIL_FEATURE === 'true' ||
  RAW_EMAIL_FEATURE === '1' ||
  (RAW_EMAIL_FEATURE === '' && process.env.NODE_ENV === 'production')

// Final flag used by sendEmail()
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

const DEFAULT_CONTACT_EMAIL = 'taylor@latimere.com'

/**
 * Local TS shapes – these don’t have to be 1:1 with GraphQL types,
 * but we keep them close for sanity.
 */
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
  referralCode?: string | null
  partnerId?: string | null
}

type SuccessResponse = {
  ok: true
  referral: Referral
  onboardingUrl: string
  mode: 'local-mock' | 'appsync'
}

type ErrorResponse = {
  ok: false
  error: string
}

/**
 * GraphQL mutation – create referral
 */
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
      referralCode
      partnerId
      createdAt
      updatedAt
    }
  }
`

/**
 * GraphQL query – lookup ReferralPartner by referralCode
 * (backed by @index(name: "byReferralCodePartner", queryField: "referralPartnerByCode"))
 */
const GET_REFERRAL_PARTNER_BY_CODE = /* GraphQL */ `
  query ReferralPartnerByCode($referralCode: String!) {
    referralPartnerByCode(referralCode: $referralCode) {
      items {
        id
        name
        type
        referralCode
        active
        totalReferrals
        totalPayouts
      }
    }
  }
`

/**
 * Logging helpers with per-request id
 */
function logDebug(reqId: string, msg: string, data?: unknown) {
  if (DEBUG_REFERRALS || LOG_LEVEL === 'debug') {
    console.log(`[referrals/create][${reqId}] ${msg}`, data ?? '')
  }
}

function logInfo(reqId: string, msg: string, data?: unknown) {
  if (LOG_LEVEL === 'info' || LOG_LEVEL === 'debug') {
    console.log(`[referrals/create][${reqId}] ${msg}`, data ?? '')
  }
}

function logError(reqId: string, msg: string, data?: unknown) {
  console.error(`[referrals/create][${reqId}] ${msg}`, data ?? '')
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

/**
 * Resolve AppSync config *only* from NEXT_PUBLIC_AMPLIFY_JSON
 */
function getAppSyncConfig(reqId: string) {
  const raw = process.env.NEXT_PUBLIC_AMPLIFY_JSON
  if (!raw) {
    logError(reqId, 'NEXT_PUBLIC_AMPLIFY_JSON missing at runtime')
    throw new Error(
      'AppSync not configured – NEXT_PUBLIC_AMPLIFY_JSON is missing in runtime'
    )
  }

  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch (err: any) {
    logError(reqId, 'Failed to parse NEXT_PUBLIC_AMPLIFY_JSON', {
      message: err?.message,
    })
    throw new Error('AppSync not configured – invalid NEXT_PUBLIC_AMPLIFY_JSON')
  }

  const endpoint: string | undefined = parsed.aws_appsync_graphqlEndpoint
  const apiKey: string | undefined = parsed.aws_appsync_apiKey

  logDebug(reqId, 'Resolved AppSync config from NEXT_PUBLIC_AMPLIFY_JSON', {
    hasEndpoint: !!endpoint,
    hasApiKey: !!apiKey,
    endpointSample: endpoint?.slice(0, 60),
  })

  if (!endpoint || !apiKey) {
    throw new Error(
      'AppSync not configured – aws_appsync_graphqlEndpoint or aws_appsync_apiKey missing in NEXT_PUBLIC_AMPLIFY_JSON'
    )
  }

  return { endpoint, apiKey }
}

/**
 * Call AppSync with detailed logging
 */
async function callAppSync<T>(
  reqId: string,
  query: string,
  variables: Record<string, any>
): Promise<T> {
  const { endpoint, apiKey } = getAppSyncConfig(reqId)

  const startedAt = Date.now()
  logDebug(reqId, 'Calling AppSync', {
    endpointSample: endpoint.slice(0, 60),
    hasApiKey: !!apiKey,
    variablesPreview: Object.keys(variables || {}),
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
    logError(reqId, 'Network error talking to AppSync', {
      message: networkErr?.message,
      endpointSample: endpoint.slice(0, 60),
    })
    throw new Error(
      `AppSync network error: ${networkErr?.message || 'fetch failed'}`
    )
  }

  const text = await resp.text()
  let json: any = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    logError(reqId, 'Failed to parse AppSync JSON', {
      status: resp.status,
      textSnippet: text.slice(0, 500),
    })
    throw new Error('Invalid JSON returned from AppSync')
  }

  if (!resp.ok || json.errors) {
    logError(reqId, 'AppSync GraphQL error', {
      status: resp.status,
      statusText: resp.statusText,
      errors: json.errors,
      json,
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
    logInfo(reqId, 'Email disabled – skipping send', {
      to,
      subject,
      RAW_CONTACT_MODE,
      CONTACT_MODE,
      RAW_EMAIL_FEATURE,
      EMAIL_FEATURE_ENABLED,
      ENABLE_EMAIL,
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
  try {
    const resp = await ses.send(command)

    if (DEBUG_EMAIL || DEBUG_REFERRALS || LOG_LEVEL === 'debug') {
      logDebug(reqId, 'Email sent', {
        to,
        subject,
        messageId: (resp as any).MessageId,
        latencyMs: Date.now() - startedAt,
      })
    }
  } catch (err: any) {
    logError(reqId, 'SES sendEmail failed', {
      to,
      subject,
      message: err?.message,
      stack: err?.stack,
    })
    // Bubble email failure up so caller returns 500.
    throw err
  }
}

/**
 * Extract and normalize referralCode from:
 * - body.referralCode
 * - body.code
 * - query.code / query.ref
 */
function resolveReferralCode(
  reqId: string,
  req: NextApiRequest,
  body: Record<string, any>
): string | null {
  const rawFromBody =
    (body.referralCode as string | undefined) ||
    (body.code as string | undefined)

  const rawFromQuery =
    (req.query.code as string | undefined) ||
    (req.query.ref as string | undefined)

  const raw = rawFromBody || rawFromQuery

  if (!raw) {
    logDebug(reqId, 'No referralCode provided in body or query')
    return null
  }

  const normalized = raw.trim()
  if (!normalized) {
    logDebug(reqId, 'ReferralCode provided but empty after trim', { raw })
    return null
  }

  // You can decide your formatting convention here; uppercasing is common.
  const upper = normalized.toUpperCase()

  logInfo(reqId, 'Resolved referralCode', {
    raw,
    normalized: upper,
    from: rawFromBody ? 'body' : 'query',
  })

  return upper
}

/**
 * Lookup ReferralPartner by referralCode (AppSync)
 */
async function lookupReferralPartnerByCode(
  reqId: string,
  referralCode: string
): Promise<{ id: string; name: string; type?: string | null } | null> {
  try {
    type PartnerQueryResp = {
      referralPartnerByCode: {
        items: Array<{
          id: string
          name: string
          type?: string | null
          referralCode: string
          active?: boolean | null
        }>
      }
    }

    const data = await callAppSync<PartnerQueryResp>(reqId, GET_REFERRAL_PARTNER_BY_CODE, {
      referralCode,
    })

    const items = data.referralPartnerByCode?.items ?? []
    if (!items.length) {
      logInfo(reqId, 'No ReferralPartner found for referralCode', {
        referralCode,
      })
      return null
    }

    // Prefer first active partner if multiple somehow exist
    const active =
      items.find((p) => p.active !== false) || items[0]

    logInfo(reqId, 'Resolved ReferralPartner for referralCode', {
      referralCode,
      partnerId: active.id,
      partnerName: active.name,
      partnerType: active.type,
    })

    return {
      id: active.id,
      name: active.name,
      type: active.type ?? null,
    }
  } catch (err: any) {
    logError(reqId, 'Error looking up ReferralPartner by code', {
      referralCode,
      message: err?.message,
      stack: err?.stack,
    })
    // We do NOT fail the entire request if the partner lookup fails.
    return null
  }
}

/**
 * API handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse | { error: string }>
) {
  const reqId = randomUUID().slice(0, 8)

  logInfo(reqId, 'Incoming request', {
    method: req.method,
    path: req.url,
    nodeEnv: process.env.NODE_ENV,
  })

  // Log email config per-request so we can see what runtime actually sees
  logInfo(reqId, 'Email feature config', {
    RAW_CONTACT_MODE,
    CONTACT_MODE,
    RAW_EMAIL_FEATURE,
    EMAIL_FEATURE_ENABLED,
    ENABLE_EMAIL,
    SES_FROM_ADDRESS,
    SES_REGION,
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
      ok: false,
      error:
        'Missing required fields: realtorName, realtorEmail, clientName, clientEmail',
    })
  }

  const normalizedRealtorEmail = String(realtorEmail).trim().toLowerCase()
  const normalizedClientEmail = String(clientEmail).trim().toLowerCase()
  const inviteToken = randomUUID()
  const normalizedSource = source || 'realtor'

  const resolvedReferralCode = resolveReferralCode(reqId, req, body)

  logDebug(reqId, 'Prepared referral base payload', {
    realtorName,
    normalizedRealtorEmail,
    clientName,
    normalizedClientEmail,
    normalizedSource,
    inviteToken,
    resolvedReferralCode,
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
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || DEFAULT_CONTACT_EMAIL

  try {
    const isLocalMock =
      process.env.NEXT_PUBLIC_ENV === 'local' &&
      process.env.USE_REAL_APPSYNC_LOCAL !== '1'

    let partnerId: string | null = null

    if (!isLocalMock && resolvedReferralCode) {
      const partner = await lookupReferralPartnerByCode(
        reqId,
        resolvedReferralCode
      )
      if (partner) {
        partnerId = partner.id
      }
    } else if (resolvedReferralCode) {
      logDebug(reqId, 'Skipping partner lookup in LOCAL MOCK mode', {
        resolvedReferralCode,
      })
    }

    const nowIso = new Date().toISOString()

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
      referralCode: resolvedReferralCode,
      partnerId,
      // lightweight status change audit fields from schema (optional)
      lastStatusChangedAt: nowIso,
      lastStatusChangedBy: 'api:referrals/create',
      lastStatusChangeReason: 'Initial referral created in INVITED status',
    }

    logDebug(reqId, 'Final CreateReferral input', {
      inputPreview: {
        ...input,
        // avoid dumping entire notes/debugContext if large
        notes: notes ? '[present]' : undefined,
      },
    })

    let referral: Referral
    let mode: 'local-mock' | 'appsync' = 'appsync'

    if (isLocalMock) {
      referral = {
        id: `local-${Date.now()}`,
        ...input,
      }
      mode = 'local-mock'
      logDebug(reqId, 'LOCAL MODE – mocking AppSync referral create', {
        referral,
      })
    } else {
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

      mode = 'appsync'

      logInfo(reqId, 'Referral created via AppSync', {
        id: referral.id,
        inviteToken: referral.inviteToken || inviteToken,
        onboardingStatus: referral.onboardingStatus,
        referralCode: referral.referralCode,
        partnerId: referral.partnerId,
      })
    }

    // Email to client
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

    // Email to referrer (realtor)
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
ReferralCode: ${resolvedReferralCode || '(none)'}

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
          <strong>Source:</strong> ${normalizedSource}<br/>
          <strong>ReferralCode:</strong> ${
            resolvedReferralCode || '(none)'
          }
        </p>
        <p>
          <strong>Onboarding link:</strong><br/>
          <a href="${onboardingUrl}">${onboardingUrl}</a><br/>
          <strong>Realtor status page:</strong><br/>
          <a href="${statusUrl}">${statusUrl}</a>
        </p>
        <p>
          <strong>Notes:</strong><br/>
          <pre style="white-space:pre-wrap;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${
            notes || '(none provided)'
          }</pre>
        </p>
        <p>Referral id: ${referral.id}</p>
      `,
    })

    logInfo(reqId, 'Finished successfully', {
      referralId: referral.id,
      inviteToken,
      mode,
      referralCode: resolvedReferralCode,
      partnerId,
    })

    return res.status(200).json({
      ok: true,
      referral,
      onboardingUrl,
      mode,
    })
  } catch (err: any) {
    logError(reqId, 'Unexpected error in handler', {
      message: err?.message,
      stack: err?.stack,
    })

    return res.status(500).json({
      ok: false,
      error:
        err?.message ||
        'Unexpected server error while creating referral (see server logs)',
    })
  }
}

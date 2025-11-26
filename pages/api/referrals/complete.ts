// pages/api/referrals/complete.ts
/* eslint-disable no-console */
import type { NextApiRequest, NextApiResponse } from 'next'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { randomUUID } from 'crypto'

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const ONBOARDING_STATUS_DETAILS_PROVIDED = 'DETAILS_PROVIDED' as const

/* -------------------------------------------------------------------------- */
/* Logging helpers                                                            */
/* -------------------------------------------------------------------------- */

const DEBUG_REFERRALS = process.env.DEBUG_REFERRAL_INVITES === '1'
const DEBUG_EMAIL = process.env.DEBUG_EMAIL === '1'
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

function logDebug(reqId: string, msg: string, data?: unknown) {
  if (DEBUG_REFERRALS || LOG_LEVEL === 'debug') {
    console.log(`[referrals/complete][${reqId}] ${msg}`, data ?? '')
  }
}

function logInfo(reqId: string, msg: string, data?: unknown) {
  if (LOG_LEVEL === 'info' || LOG_LEVEL === 'debug') {
    console.log(`[referrals/complete][${reqId}] ${msg}`, data ?? '')
  }
}

function logError(reqId: string, msg: string, data?: unknown) {
  console.error(`[referrals/complete][${reqId}] ${msg}`, data ?? '')
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

/* -------------------------------------------------------------------------- */
/* AppSync caller                                                             */
/* -------------------------------------------------------------------------- */

async function callAppSync<T>(
  reqId: string,
  query: string,
  variables: Record<string, any>
): Promise<T> {
  const { endpoint, apiKey } = getAppSyncConfig(reqId)

  logDebug(reqId, 'Calling AppSync', {
    endpointSample: endpoint.slice(0, 60),
    hasApiKey: !!apiKey,
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
      variables,
    })

    const firstMsg = json.errors?.[0]?.message
    throw new Error(firstMsg || 'You are not authorized to make this call.')
  }

  return json.data as T
}

/* -------------------------------------------------------------------------- */
/* SES email configuration                                                    */
/* -------------------------------------------------------------------------- */

// Same pattern as in create.ts: default ON in prod
const RAW_CONTACT_MODE =
  process.env.CONTACT_MODE || process.env.CONTACT_DELIVERY_MODE || ''

const CONTACT_MODE =
  RAW_CONTACT_MODE.trim().toLowerCase() ||
  (process.env.NODE_ENV === 'production' ? 'ses' : '')

const RAW_EMAIL_FEATURE = (process.env.EMAIL_FEATURE_ENABLED || '')
  .trim()
  .toLowerCase()

const EMAIL_FEATURE_ENABLED =
  RAW_EMAIL_FEATURE === '1' ||
  RAW_EMAIL_FEATURE === 'true' ||
  (RAW_EMAIL_FEATURE === '' && process.env.NODE_ENV === 'production')

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

async function sendEmail(params: {
  reqId: string
  to: string[]
  subject: string
  html: string
  text: string
}) {
  const { reqId, to, subject, html, text } = params

  if (!ENABLE_EMAIL) {
    logDebug(reqId, 'Email disabled – skipping completion email', {
      CONTACT_MODE,
      EMAIL_FEATURE_ENABLED,
      to,
      subject,
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

  if (DEBUG_EMAIL || DEBUG_REFERRALS || LOG_LEVEL === 'debug') {
    console.log('[referrals/complete] email sent', {
      to,
      subject,
      messageId: resp.MessageId,
      latencyMs: Date.now() - startedAt,
    })
  }
}

/* -------------------------------------------------------------------------- */
/* GraphQL mutation – updateReferral                                          */
/* -------------------------------------------------------------------------- */

const UPDATE_REFERRAL_MUTATION = /* GraphQL */ `
  mutation CompleteReferral($input: UpdateReferralInput!) {
    updateReferral(input: $input) {
      id
      onboardingStatus
      clientName
      clientEmail
      realtorName
      realtorEmail
      source
      inviteToken
      payoutEligible
      payoutSent
      payoutMethod
      notes
      updatedAt
    }
  }
`

/* -------------------------------------------------------------------------- */
/* Handler                                                                    */
/* -------------------------------------------------------------------------- */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reqId = randomUUID().slice(0, 8)

  logInfo(reqId, 'Incoming referral details submission', {
    method: req.method,
    path: req.url,
    nodeEnv: process.env.NODE_ENV,
  })

  // Log email feature flags once per request
  logDebug(reqId, 'Email feature config (complete)', {
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
  logDebug(reqId, 'Raw completion payload', body)

  const referralId = body.referralId || body.id
  const notes =
    typeof body.notes === 'string' ? body.notes : body.notes?.toString?.() || ''

  if (!referralId) {
    return res.status(400).json({
      error: 'Missing referral identifier – expected referralId or id',
    })
  }

  const isLocalMock =
    process.env.NEXT_PUBLIC_ENV === 'local' &&
    process.env.USE_REAL_APPSYNC_LOCAL !== '1'

  try {
    let updated: any

    if (isLocalMock) {
      // Local mock – no network call
      updated = {
        id: referralId,
        onboardingStatus: ONBOARDING_STATUS_DETAILS_PROVIDED,
        clientName: 'Local Test Host',
        clientEmail: 'local-test-host@example.com',
        realtorName: 'Local Test Realtor',
        realtorEmail: 'test-realtor@example.com',
        notes,
        updatedAt: new Date().toISOString(),
        _localMock: true,
      }

      logDebug(reqId, 'LOCAL MODE – mocked referral details submission', updated)
    } else {
      // Real AppSync mutation
      type UpdateResp = { updateReferral: any }

      const input: any = {
        id: referralId,
        onboardingStatus: ONBOARDING_STATUS_DETAILS_PROVIDED,
      }
      if (notes) input.notes = notes

      logDebug(reqId, 'Prepared updateReferral input', { input })
      logInfo(reqId, 'Updating referral onboardingStatus to DETAILS_PROVIDED', {
        referralId,
      })

      const data = await callAppSync<UpdateResp>(
        reqId,
        UPDATE_REFERRAL_MUTATION,
        { input }
      )

      updated = data.updateReferral
      if (!updated) {
        throw new Error('updateReferral returned no data')
      }

      logInfo(reqId, 'Referral updated in AppSync', {
        id: updated.id,
        onboardingStatus: updated.onboardingStatus,
      })
    }

    // Internal notification email
    const contactEmail =
      process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'taylor@latimere.com'

    await sendEmail({
      reqId,
      to: [contactEmail],
      subject: `Referral details submitted: ${updated.clientName || ''}`,
      text: `Referral details have been submitted.

Referral id: ${updated.id}
Client: ${updated.clientName} (${updated.clientEmail})
Realtor: ${updated.realtorName} (${updated.realtorEmail})
Status: ${updated.onboardingStatus}
Notes: ${updated.notes || '(none)'}
(Local mock: ${updated._localMock ? 'yes' : 'no'})`,
      html: `
        <p><strong>Referral details have been submitted.</strong></p>
        <p>
          <strong>Referral id:</strong> ${updated.id}<br/>
          <strong>Client:</strong> ${updated.clientName} (${updated.clientEmail})<br/>
          <strong>Realtor:</strong> ${updated.realtorName} (${updated.realtorEmail})<br/>
          <strong>Status:</strong> ${updated.onboardingStatus}<br/>
          <strong>Notes:</strong> ${updated.notes || '(none)'}<br/>
          <strong>Local mock:</strong> ${updated._localMock ? 'yes' : 'no'}
        </p>
      `,
    })

    return res.status(200).json({
      ok: true,
      referral: updated,
      mode: isLocalMock ? 'local-mock' : 'appsync',
    })
  } catch (err: any) {
    logError(reqId, 'Unexpected error in completion handler', {
      message: err?.message,
      stack: err?.stack,
    })

    return res.status(500).json({
      error:
        err?.message ||
        'Unexpected server error while completing referral (see server logs)',
    })
  }
}

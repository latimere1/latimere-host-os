// pages/api/referrals/complete.ts
/* eslint-disable no-console */
import type { NextApiRequest, NextApiResponse } from 'next'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { randomUUID } from 'crypto'

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
/* AppSync config FROM NEXT_PUBLIC_AMPLIFY_JSON ONLY                          */
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

  const endpoint = parsed.aws_appsync_graphqlEndpoint
  const apiKey = parsed.aws_appsync_apiKey

  logDebug(reqId, 'AppSync config (complete)', {
    hasEndpoint: !!endpoint,
    hasApiKey: !!apiKey,
    endpointSample: endpoint?.slice(0, 64)
  })

  if (!endpoint || !apiKey) {
    throw new Error('AppSync not configured – missing endpoint or API key')
  }

  return { endpoint, apiKey }
}

/* -------------------------------------------------------------------------- */
/* AppSync caller                                                              */
/* -------------------------------------------------------------------------- */

async function callAppSync<T>(
  reqId: string,
  query: string,
  variables: Record<string, any>
): Promise<T> {
  const { endpoint, apiKey } = getAppSyncConfig(reqId)

  logDebug(reqId, 'Calling AppSync', {
    endpointSample: endpoint.slice(0, 60),
    variables
  })

  let resp: Response
  try {
    resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({ query, variables })
    })
  } catch (networkErr: any) {
    logError(reqId, 'Network error calling AppSync', {
      message: networkErr?.message
    })
    throw new Error(`AppSync network error: ${networkErr?.message}`)
  }

  const text = await resp.text()
  let json: any
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    logError(reqId, 'Failed to parse AppSync JSON', {
      status: resp.status,
      body: text.slice(0, 500)
    })
    throw new Error('Invalid JSON returned from AppSync')
  }

  if (!resp.ok || json.errors) {
    logError(reqId, 'AppSync GraphQL error', {
      status: resp.status,
      statusText: resp.statusText,
      errors: json.errors
    })
    const first = json.errors?.[0]?.message
    throw new Error(first || 'You are not authorized to make this call.')
  }

  return json.data as T
}

/* -------------------------------------------------------------------------- */
/* SES email config                                                            */
/* -------------------------------------------------------------------------- */

const CONTACT_MODE =
  process.env.CONTACT_DELIVERY_MODE?.toLowerCase() ||
  process.env.CONTACT_MODE?.toLowerCase() ||
  ''

const RAW_EMAIL_FEATURE = (process.env.EMAIL_FEATURE_ENABLED || '').trim().toLowerCase()
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

async function sendEmail({
  reqId,
  to,
  subject,
  html,
  text
}: {
  reqId: string
  to: string[]
  subject: string
  html: string
  text: string
}) {
  if (!ENABLE_EMAIL) {
    logDebug(reqId, 'Email disabled – skipping', {
      CONTACT_MODE,
      EMAIL_FEATURE_ENABLED
    })
    return
  }

  if (!to.length) {
    logError(reqId, 'Attempted sendEmail with zero recipients', { subject })
    return
  }

  const command = new SendEmailCommand({
    Source: SES_FROM_ADDRESS,
    Destination: { ToAddresses: to },
    Message: {
      Subject: { Data: subject },
      Body: { Text: { Data: text }, Html: { Data: html } }
    }
  })

  const started = Date.now()
  const resp = await ses.send(command)

  if (DEBUG_EMAIL || DEBUG_REFERRALS || LOG_LEVEL === 'debug') {
    console.log(`[referrals/complete][${reqId}] SES sent`, {
      messageId: resp.MessageId,
      latencyMs: Date.now() - started
    })
  }
}

/* -------------------------------------------------------------------------- */
/* GraphQL updateReferral mutation                                             */
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
      notes
      updatedAt
    }
  }
`

/* -------------------------------------------------------------------------- */
/* Handler                                                                     */
/* -------------------------------------------------------------------------- */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reqId = randomUUID().slice(0, 8)

  logInfo(reqId, 'Incoming completion request', {
    method: req.method,
    path: req.url,
    nodeEnv: process.env.NODE_ENV
  })

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = parseBody(req)
  logDebug(reqId, 'Incoming payload', body)

  const referralId = body.referralId || body.id
  if (!referralId) {
    return res.status(400).json({ error: 'Missing referralId or id' })
  }

  const notes =
    typeof body.notes === 'string' ? body.notes : body.notes?.toString?.() || ''

  const isLocalMock =
    process.env.NEXT_PUBLIC_ENV === 'local' &&
    process.env.USE_REAL_APPSYNC_LOCAL !== '1'

  try {
    let updated: any

    if (isLocalMock) {
      updated = {
        id: referralId,
        onboardingStatus: 'COMPLETED',
        notes,
        clientName: 'Local Test',
        clientEmail: 'local@test.com',
        realtorName: 'Local Realtor',
        realtorEmail: 'local@latimere.com',
        updatedAt: new Date().toISOString()
      }

      logDebug(reqId, 'LOCAL MODE: mocked completion', updated)
    } else {
      type MutationResp = { updateReferral: any }

      const input = {
        id: referralId,
        onboardingStatus: 'COMPLETED',
        notes
      }

      const data = await callAppSync<MutationResp>(
        reqId,
        UPDATE_REFERRAL_MUTATION,
        { input }
      )

      updated = data.updateReferral
      logInfo(reqId, 'Referral updated in AppSync', updated)
    }

    // Internal notification
    await sendEmail({
      reqId,
      to: [process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'taylor@latimere.com'],
      subject: `Referral completed: ${updated.clientName ?? ''}`,
      text: `Referral ${updated.id} completed.`,
      html: `<p><strong>Referral ${updated.id} completed.</strong></p>`
    })

    return res.status(200).json({
      ok: true,
      referral: updated,
      mode: isLocalMock ? 'local-mock' : 'appsync'
    })
  } catch (err: any) {
    logError(reqId, 'Unexpected error during completion', {
      message: err?.message,
      stack: err?.stack
    })

    return res.status(500).json({
      error:
        err?.message ||
        'Unexpected error completing referral (see server logs)'
    })
  }
}

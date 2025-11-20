// pages/api/referrals/complete.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { randomUUID } from 'crypto'

const DEBUG_REFERRALS = process.env.DEBUG_REFERRAL_INVITES === '1'
const DEBUG_EMAIL = process.env.DEBUG_EMAIL === '1'
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

function logDebug(reqId: string, msg: string, data?: unknown) {
  if (DEBUG_REFERRALS || LOG_LEVEL === 'debug') {
    // eslint-disable-next-line no-console
    console.log(`[referrals/complete][${reqId}] ${msg}`, data ?? '')
  }
}

function logError(reqId: string, msg: string, data?: unknown) {
  // eslint-disable-next-line no-console
  console.error(`[referrals/complete][${reqId}] ${msg}`, data ?? '')
}

/**
 * Resolve AppSync config at request time.
 *
 * Priority:
 *   1. APPSYNC_GRAPHQL_ENDPOINT / APPSYNC_API_KEY
 *   2. NEXT_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT / NEXT_PUBLIC_APPSYNC_API_KEY
 *   3. NEXT_PUBLIC_AMPLIFY_JSON (aws_appsync_graphqlEndpoint / aws_appsync_apiKey)
 */
function getAppSyncConfig(reqId: string) {
  let endpoint =
    process.env.APPSYNC_GRAPHQL_ENDPOINT ||
    process.env.NEXT_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT ||
    ''

  let apiKey =
    process.env.APPSYNC_API_KEY ||
    process.env.NEXT_PUBLIC_APPSYNC_API_KEY ||
    ''

  const sources: string[] = []

  if (endpoint) sources.push('direct-endpoint-env')
  if (apiKey) sources.push('direct-apikey-env')

  if ((!endpoint || !apiKey) && process.env.NEXT_PUBLIC_AMPLIFY_JSON) {
    try {
      const raw = process.env.NEXT_PUBLIC_AMPLIFY_JSON
      const parsed = JSON.parse(raw as string)

      const amplifyEndpoint =
        parsed.aws_appsync_graphqlEndpoint ||
        parsed.aws_appsync_graphqlEndpoint?.trim?.()
      const amplifyKey =
        parsed.aws_appsync_apiKey || parsed.aws_appsync_apiKey?.trim?.()

      if (!endpoint && amplifyEndpoint) {
        endpoint = amplifyEndpoint
        sources.push('amplify-json-endpoint')
      }

      if (!apiKey && amplifyKey) {
        apiKey = amplifyKey
        sources.push('amplify-json-apikey')
      }

      logDebug(reqId, 'Resolved AppSync config from Amplify JSON (if needed)', {
        usedAmplifyJson: true,
        endpointFromAmplify: Boolean(amplifyEndpoint),
        apiKeyFromAmplify: Boolean(amplifyKey),
      })
    } catch (err: any) {
      logError(reqId, 'Failed to parse NEXT_PUBLIC_AMPLIFY_JSON', {
        message: err?.message,
      })
    }
  }

  if (endpoint || apiKey) {
    logDebug(reqId, 'AppSync config resolved', {
      endpointExists: Boolean(endpoint),
      apiKeyExists: Boolean(apiKey),
      sources,
    })
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

  if (DEBUG_EMAIL || DEBUG_REFERRALS || LOG_LEVEL === 'debug') {
    // eslint-disable-next-line no-console
    console.log('[referrals/complete] email sent', {
      to,
      subject,
      messageId: resp.MessageId,
      latencyMs: Date.now() - startedAt,
    })
  }
}

/**
 * Real AppSync call – used in dev/prod or when USE_REAL_APPSYNC_LOCAL=1
 */
async function callAppSync<T>(
  reqId: string,
  query: string,
  variables: Record<string, any>
): Promise<T> {
  const { endpoint, apiKey } = getAppSyncConfig(reqId)

  if (!endpoint || !apiKey) {
    logError(reqId, 'AppSync not configured', {
      endpoint,
      apiKeyExists: Boolean(apiKey),
      envKeys: {
        hasAPPSYNC_GRAPHQL_ENDPOINT: Boolean(
          process.env.APPSYNC_GRAPHQL_ENDPOINT
        ),
        hasNEXT_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT: Boolean(
          process.env.NEXT_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT
        ),
        hasAPPSYNC_API_KEY: Boolean(process.env.APPSYNC_API_KEY),
        hasNEXT_PUBLIC_APPSYNC_API_KEY: Boolean(
          process.env.NEXT_PUBLIC_APPSYNC_API_KEY
        ),
        hasAmplifyJson: Boolean(process.env.NEXT_PUBLIC_AMPLIFY_JSON),
      },
    })
    throw new Error(
      'AppSync not configured – check APPSYNC_GRAPHQL_ENDPOINT / APPSYNC_API_KEY or NEXT_PUBLIC_AMPLIFY_JSON'
    )
  }

  const startedAt = Date.now()
  logDebug(reqId, 'Calling AppSync', { endpoint, hasApiKey: !!apiKey, variables })

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
 * Minimal updateReferral mutation – we bump onboardingStatus and can update notes.
 * Fields in the selection set are all present in your existing schema.
 */
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

/**
 * Normalize JSON body
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
    referralId,
    inviteToken,
    onboardingStatus,
    clientName,
    clientEmail,
    realtorName,
    realtorEmail,
    notes,
    // other onboarding fields (phone, propertyAddress, etc.) may be present in body
  } = body as any

  logDebug(reqId, 'Raw completion payload', body)

  if (!referralId && !body.id && !inviteToken) {
    return res.status(400).json({
      error:
        'Missing referral identifier – expected referralId, id, or inviteToken',
    })
  }

  const isLocalMock =
    process.env.NEXT_PUBLIC_ENV === 'local' &&
    process.env.USE_REAL_APPSYNC_LOCAL !== '1'

  try {
    let updated: any = null

    if (isLocalMock) {
      // ──────────────────────────────────────
      // LOCALHOST MOCK MODE – NO APPSYNC CALL
      // ──────────────────────────────────────
      updated = {
        id: referralId || body.id || `local-${Date.now()}`,
        onboardingStatus: onboardingStatus || 'COMPLETED',
        clientName: clientName || 'Local Test Host',
        clientEmail: clientEmail || 'local-test-host@example.com',
        realtorName: realtorName || 'Local Test Realtor',
        realtorEmail: realtorEmail || 'test-realtor@example.com',
        notes: notes || '',
        inviteToken: inviteToken || body.inviteToken || body.token,
        updatedAt: new Date().toISOString(),
        _localMock: true,
      }

      logDebug(reqId, 'LOCAL MODE – mocking referral completion', {
        updated,
      })
    } else {
      // ──────────────────────────────────────
      // REAL APPSYNC UPDATE (DEV/PROD)
      // ──────────────────────────────────────
      const input: any = {
        id: referralId || body.id, // must exist for UpdateReferralInput
        onboardingStatus: onboardingStatus || 'COMPLETED',
      }

      // Optional: update notes if provided
      if (typeof notes === 'string') {
        input.notes = notes
      }

      type UpdateResp = {
        updateReferral: any
      }

      const data = await callAppSync<UpdateResp>(
        reqId,
        UPDATE_REFERRAL_MUTATION,
        { input }
      )

      updated = data.updateReferral

      if (!updated) {
        throw new Error('updateReferral returned no data')
      }

      logDebug(reqId, 'Referral updated in AppSync', {
        id: updated.id,
        onboardingStatus: updated.onboardingStatus,
      })
    }

    // Internal notification email to you
    const contactEmail =
      process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'taylor@latimere.com'

    await sendEmail({
      reqId,
      to: [contactEmail],
      subject: `Referral onboarding completed: ${updated.clientName || ''}`,
      text: `Referral onboarding completed.

Referral id: ${updated.id}
Client: ${updated.clientName} (${updated.clientEmail})
Realtor: ${updated.realtorName} (${updated.realtorEmail})
Status: ${updated.onboardingStatus}

(Local mock: ${updated._localMock ? 'yes' : 'no'})`,
      html: `
        <p><strong>Referral onboarding completed.</strong></p>
        <p>
          <strong>Referral id:</strong> ${updated.id}<br/>
          <strong>Client:</strong> ${updated.clientName} (${updated.clientEmail})<br/>
          <strong>Realtor:</strong> ${updated.realtorName} (${updated.realtorEmail})<br/>
          <strong>Status:</strong> ${updated.onboardingStatus}<br/>
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

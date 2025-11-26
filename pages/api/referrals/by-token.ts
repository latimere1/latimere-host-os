// pages/api/referrals/by-token.ts
/* eslint-disable no-console */
import type { NextApiRequest, NextApiResponse } from 'next'
import { randomUUID } from 'crypto'

const DEBUG_REFERRALS = process.env.DEBUG_REFERRAL_INVITES === '1'
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

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
  createdAt?: string | null
  updatedAt?: string | null
}

type SuccessResponse = {
  ok: true
  inviteToken: string
  referral: Referral
  mode: 'local-mock' | 'appsync'
}

type ErrorResponse = {
  ok?: false
  error: string
}

/* -------------------------------------------------------------------------- */
/* Logging helpers                                                            */
/* -------------------------------------------------------------------------- */

function logDebug(reqId: string, msg: string, data?: unknown) {
  if (DEBUG_REFERRALS || LOG_LEVEL === 'debug') {
    console.log(`[referrals/by-token][${reqId}] ${msg}`, data ?? '')
  }
}

function logInfo(reqId: string, msg: string, data?: unknown) {
  if (LOG_LEVEL === 'info' || LOG_LEVEL === 'debug') {
    console.log(`[referrals/by-token][${reqId}] ${msg}`, data ?? '')
  }
}

function logError(reqId: string, msg: string, data?: unknown) {
  console.error(`[referrals/by-token][${reqId}] ${msg}`, data ?? '')
}

/* -------------------------------------------------------------------------- */
/* AppSync config via NEXT_PUBLIC_AMPLIFY_JSON                                */
/* -------------------------------------------------------------------------- */

/**
 * Resolve AppSync config *only* from NEXT_PUBLIC_AMPLIFY_JSON
 * (same pattern as /api/referrals/create.ts).
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

/* -------------------------------------------------------------------------- */
/* Shared AppSync caller                                                      */
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
    // Surface the same “You are not authorized…” message you saw before so the UI
    // still behaves the same, but with logs giving full context.
    throw new Error(firstMsg || 'You are not authorized to make this call.')
  }

  logDebug(reqId, 'AppSync success', { latencyMs: Date.now() - startedAt })
  return json.data as T
}

/* -------------------------------------------------------------------------- */
/* GraphQL query                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Query matches the index in schema.graphql:
 * inviteToken: String! @index(name: "byInviteToken", queryField: "referralByInviteToken")
 */
const REFERRAL_BY_INVITE_TOKEN = /* GraphQL */ `
  query ReferralByInviteToken($inviteToken: String!, $limit: Int) {
    referralByInviteToken(inviteToken: $inviteToken, limit: $limit) {
      items {
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
      nextToken
    }
  }
`

/* -------------------------------------------------------------------------- */
/* API handler                                                                */
/* -------------------------------------------------------------------------- */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  const reqId = randomUUID().slice(0, 8)

  logInfo(reqId, 'Incoming request', {
    method: req.method,
    path: req.url,
    nodeEnv: process.env.NODE_ENV,
    nextPublicEnv: process.env.NEXT_PUBLIC_ENV,
  })

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Token may come as ?token=... or ?inviteToken=...
  const rawToken =
    (req.query.token as string | undefined) ||
    (req.query.inviteToken as string | undefined) ||
    ''
  const inviteToken = rawToken.trim()

  if (!inviteToken) {
    logDebug(reqId, 'Missing inviteToken query param', { rawToken })
    return res.status(400).json({ error: 'Missing inviteToken query param' })
  }

  const isLocalMock =
    process.env.NEXT_PUBLIC_ENV === 'local' &&
    process.env.USE_REAL_APPSYNC_LOCAL !== '1'

  try {
    let referral: Referral | null = null

    if (isLocalMock) {
      // Local/dev mock mode – no network call
      referral = {
        id: `local-${Date.now()}`,
        clientName: 'Local Test Host',
        clientEmail: 'local-test-host@example.com',
        realtorName: 'Local Test Realtor',
        realtorEmail: 'test-realtor@example.com',
        source: 'local-mock',
        onboardingStatus: 'INVITED',
        inviteToken,
        payoutEligible: false,
        payoutSent: false,
        payoutMethod: null,
        notes:
          'Mocked referral for local onboarding flow. This is not persisted.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      logDebug(reqId, 'LOCAL MODE – returning mocked referral', {
        inviteToken,
        referralId: referral.id,
      })
    } else {
      // Real AppSync query
      type QueryResp = {
        referralByInviteToken: {
          items: Referral[]
          nextToken: string | null
        }
      }

      const data = await callAppSync<QueryResp>(
        reqId,
        REFERRAL_BY_INVITE_TOKEN,
        { inviteToken, limit: 1 }
      )

      const items = data.referralByInviteToken?.items ?? []
      referral = items[0] ?? null

      logDebug(reqId, 'Loaded referral from AppSync', {
        inviteToken,
        found: !!referral,
      })
    }

    if (!referral) {
      return res.status(404).json({
        error: 'Referral not found for invite token',
      })
    }

    return res.status(200).json({
      ok: true,
      inviteToken,
      referral,
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
        'Unexpected server error while looking up referral (see server logs)',
    })
  }
}

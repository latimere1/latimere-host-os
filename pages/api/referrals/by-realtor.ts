// pages/api/referrals/by-realtor.ts
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

/**
 * Logging helpers
 */
function logDebug(reqId: string, msg: string, data?: unknown) {
  if (DEBUG_REFERRALS || LOG_LEVEL === 'debug') {
    // eslint-disable-next-line no-console
    console.log(`[referrals/by-realtor][${reqId}] ${msg}`, data ?? '')
  }
}

function logError(reqId: string, msg: string, data?: unknown) {
  // eslint-disable-next-line no-console
  console.error(`[referrals/by-realtor][${reqId}] ${msg}`, data ?? '')
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

  // Fallback: parse Amplify JSON if either piece is missing
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
 * Real AppSync call (used in dev/prod or when USE_REAL_APPSYNC_LOCAL=1)
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
  logDebug(reqId, 'Calling AppSync', {
    endpoint,
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
 * GraphQL query – uses listReferrals with a filter on realtorEmail.
 * This matches the current deployed schema (no normalized* fields, no custom query).
 */
const LIST_REFERRALS_FOR_REALTOR = /* GraphQL */ `
  query ListReferralsForRealtor($realtorEmail: String!, $limit: Int) {
    listReferrals(
      filter: { realtorEmail: { eq: $realtorEmail } }
      limit: $limit
    ) {
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawEmail = (req.query.email as string | undefined) || ''
  const email = rawEmail.trim().toLowerCase()

  if (!email) {
    logDebug(reqId, 'Missing email query param', { rawEmail })
    return res.status(400).json({ error: 'Missing email query parameter' })
  }

  const isLocalMock =
    process.env.NEXT_PUBLIC_ENV === 'local' &&
    process.env.USE_REAL_APPSYNC_LOCAL !== '1'

  try {
    let items: Referral[] = []
    let nextToken: string | null = null

    if (isLocalMock) {
      // ──────────────────────────────────────
      // LOCALHOST MOCK MODE (no network call)
      // ──────────────────────────────────────
      items = [
        {
          id: `local-${Date.now()}`,
          clientName: 'Test Host One',
          clientEmail: 'test-host-one@example.com',
          realtorName: 'Local Test Realtor',
          realtorEmail: email,
          source: 'local-mock',
          onboardingStatus: 'INVITED',
          inviteToken: 'mock-token-1',
          payoutEligible: false,
          payoutSent: false,
          payoutMethod: null,
          notes: 'This is a mocked referral generated on localhost.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      logDebug(reqId, 'LOCAL MODE – returning mocked referrals', {
        email,
        count: items.length,
      })
    } else {
      // ──────────────────────────────────────
      // REAL APPSYNC QUERY (dev/prod)
      // ──────────────────────────────────────
      type QueryResp = {
        listReferrals: {
          items: Referral[]
          nextToken: string | null
        }
      }

      const data = await callAppSync<QueryResp>(
        reqId,
        LIST_REFERRALS_FOR_REALTOR,
        { realtorEmail: email, limit: 50 }
      )

      items = data.listReferrals?.items ?? []
      nextToken = data.listReferrals?.nextToken ?? null

      logDebug(reqId, 'Loaded referrals from AppSync', {
        email,
        count: items.length,
        nextToken,
      })
    }

    return res.status(200).json({
      ok: true,
      email,
      referrals: items, // what status page should use
      items, // backwards-compat
      nextToken,
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
        'Unexpected server error while loading referrals (see server logs)',
    })
  }
}

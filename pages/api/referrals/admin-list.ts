// pages/api/referrals/admin-list.ts
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
  createdAt?: string | null
  updatedAt?: string | null
}

function logDebug(reqId: string, msg: string, data?: unknown) {
  if (DEBUG_REFERRALS || LOG_LEVEL === 'debug') {
    console.log(`[referrals/admin-list][${reqId}] ${msg}`, data ?? '')
  }
}

function logInfo(reqId: string, msg: string, data?: unknown) {
  if (LOG_LEVEL === 'info' || LOG_LEVEL === 'debug') {
    console.log(`[referrals/admin-list][${reqId}] ${msg}`, data ?? '')
  }
}

function logError(reqId: string, msg: string, data?: unknown) {
  console.error(`[referrals/admin-list][${reqId}] ${msg}`, data ?? '')
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
      message: err?.message
    })
    throw new Error('AppSync not configured – invalid NEXT_PUBLIC_AMPLIFY_JSON')
  }

  const endpoint: string | undefined = parsed.aws_appsync_graphqlEndpoint
  const apiKey: string | undefined = parsed.aws_appsync_apiKey

  logDebug(reqId, 'Resolved AppSync config from NEXT_PUBLIC_AMPLIFY_JSON', {
    hasEndpoint: !!endpoint,
    hasApiKey: !!apiKey,
    endpointSample: endpoint?.slice(0, 60)
  })

  if (!endpoint || !apiKey) {
    throw new Error(
      'AppSync not configured – aws_appsync_graphqlEndpoint or aws_appsync_apiKey missing in NEXT_PUBLIC_AMPLIFY_JSON'
    )
  }

  return { endpoint, apiKey }
}

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
    logError(reqId, 'Network error talking to AppSync', {
      message: networkErr?.message,
      endpointSample: endpoint.slice(0, 60)
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
      textSnippet: text.slice(0, 500)
    })
    throw new Error('Invalid JSON returned from AppSync')
  }

  if (!resp.ok || json.errors) {
    logError(reqId, 'AppSync GraphQL error', {
      status: resp.status,
      statusText: resp.statusText,
      errors: json.errors,
      variables
    })

    const firstMsg = json.errors?.[0]?.message
    throw new Error(firstMsg || 'You are not authorized to make this call.')
  }

  logDebug(reqId, 'AppSync success', { latencyMs: Date.now() - startedAt })
  return json.data as T
}

/* -------------------------------------------------------------------------- */
/* GraphQL listReferrals query                                                */
/* -------------------------------------------------------------------------- */

const LIST_REFERRALS_ADMIN = /* GraphQL */ `
  query ListReferralsAdmin($limit: Int, $nextToken: String) {
    listReferrals(limit: $limit, nextToken: $nextToken) {
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

  logInfo(reqId, 'Incoming request', {
    method: req.method,
    path: req.url,
    nodeEnv: process.env.NODE_ENV
  })

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const limitParam = req.query.limit as string | undefined
  const limit = limitParam ? Math.min(Number(limitParam) || 100, 1000) : 100

  try {
    type QueryResp = {
      listReferrals: {
        items: Referral[]
        nextToken: string | null
      }
    }

    const data = await callAppSync<QueryResp>(
      reqId,
      LIST_REFERRALS_ADMIN,
      { limit }
    )

    const items = data.listReferrals?.items ?? []
    const nextToken = data.listReferrals?.nextToken ?? null

    logInfo(reqId, 'Loaded referrals for admin', {
      count: items.length,
      nextToken
    })

    return res.status(200).json({
      ok: true,
      referrals: items,
      nextToken
    })
  } catch (err: any) {
    logError(reqId, 'Unexpected error in admin-list handler', {
      message: err?.message,
      stack: err?.stack
    })

    return res.status(500).json({
      error:
        err?.message ||
        'Unexpected server error while listing referrals (see server logs)'
    })
  }
}

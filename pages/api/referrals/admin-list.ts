// pages/api/referrals/admin-list.ts
/* eslint-disable no-console */
import type { NextApiRequest, NextApiResponse } from 'next'
import { randomUUID } from 'crypto'

/* -------------------------------------------------------------------------- */
/* Debug / logging flags                                                      */
/* -------------------------------------------------------------------------- */

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
  // New fields in schema – optional so older data doesn’t break anything
  referralCode?: string | null
  partnerId?: string | null
  // Enriched field (not in GraphQL schema, added by this API)
  partnerName?: string | null
}

type AdminListResponse = {
  ok: boolean
  referrals?: Referral[]
  nextToken?: string | null
  error?: string
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
      variables,
    })

    const firstMsg = json.errors?.[0]?.message
    // Keep message generic to avoid leaking details to browser
    throw new Error(firstMsg || 'You are not authorized to make this call.')
  }

  logDebug(reqId, 'AppSync success', { latencyMs: Date.now() - startedAt })
  return json.data as T
}

/* -------------------------------------------------------------------------- */
/* GraphQL queries                                                            */
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
        referralCode
        partnerId
      }
      nextToken
    }
  }
`

// Enrichment query: getReferralPartner, so we can show partnerName in admin UI.
// Backed by schema type ReferralPartner with @auth including public(apiKey) read.
const GET_REFERRAL_PARTNER = /* GraphQL */ `
  query GetReferralPartner($id: ID!) {
    getReferralPartner(id: $id) {
      id
      name
      type
      referralCode
      active
      totalReferrals
      totalPayouts
    }
  }
`

/* -------------------------------------------------------------------------- */
/* Partner enrichment                                                         */
/* -------------------------------------------------------------------------- */

type ReferralPartner = {
  id: string
  name: string
  type?: string | null
  referralCode?: string | null
  active?: boolean | null
}

/**
 * For a list of referrals, look up any partnerId via getReferralPartner
 * and return a new array with partnerName filled in where possible.
 *
 * We tolerate failures here and never break the main list endpoint if
 * partner lookups fail — we just log and move on.
 */
async function enrichWithPartners(
  reqId: string,
  referrals: Referral[]
): Promise<Referral[]> {
  const partnerIds = Array.from(
    new Set(
      referrals
        .map((r) => r.partnerId)
        .filter((id): id is string => !!id && typeof id === 'string')
    )
  )

  if (!partnerIds.length) {
    logDebug(reqId, 'No partnerIds present on referrals – skipping enrichment')
    return referrals
  }

  logInfo(reqId, 'Enriching referrals with partner data', {
    uniquePartnerIds: partnerIds.length,
  })

  const partnerMap = new Map<string, ReferralPartner>()

  // Sequential lookups are simpler and probably fine for small N. If this
  // ever becomes a bottleneck, we can batch in parallel with Promise.all.
  for (const partnerId of partnerIds) {
    try {
      type GetPartnerResp = {
        getReferralPartner: ReferralPartner | null
      }

      const data = await callAppSync<GetPartnerResp>(reqId, GET_REFERRAL_PARTNER, {
        id: partnerId,
      })

      const partner = data.getReferralPartner
      if (!partner) {
        logInfo(reqId, 'No ReferralPartner found for partnerId', { partnerId })
        continue
      }

      partnerMap.set(partnerId, partner)

      logDebug(reqId, 'Resolved ReferralPartner', {
        partnerId,
        partnerName: partner.name,
        partnerType: partner.type,
      })
    } catch (err: any) {
      logError(reqId, 'Error looking up ReferralPartner', {
        partnerId,
        message: err?.message,
      })
      // Continue — we do not fail the whole admin list because one partner lookup failed
    }
  }

  if (!partnerMap.size) {
    logInfo(reqId, 'No partners resolved – returning referrals as-is')
    return referrals
  }

  const enriched = referrals.map((r) => {
    const partner = r.partnerId ? partnerMap.get(r.partnerId) : undefined
    return {
      ...r,
      partnerName: partner?.name ?? null,
    }
  })

  logInfo(reqId, 'Partner enrichment complete', {
    totalReferrals: referrals.length,
    partnersResolved: partnerMap.size,
  })

  return enriched
}

/* -------------------------------------------------------------------------- */
/* Handler                                                                    */
/* -------------------------------------------------------------------------- */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminListResponse | { error: string }>
) {
  const reqId = randomUUID().slice(0, 8)

  logInfo(reqId, 'Incoming request', {
    method: req.method,
    path: req.url,
    nodeEnv: process.env.NODE_ENV,
  })

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Robust limit parsing: handle array, NaN, and clamp
  const limitParam = Array.isArray(req.query.limit)
    ? req.query.limit[0]
    : (req.query.limit as string | undefined)

  const limit = (() => {
    const n = limitParam ? parseInt(limitParam, 10) : 100
    if (Number.isNaN(n) || n <= 0) return 100
    if (n > 1000) return 1000
    return n
  })()

  logDebug(reqId, 'Computed limit from query', {
    limitParam,
    limit,
  })

  try {
    type QueryResp = {
      listReferrals: {
        items: Referral[]
        nextToken: string | null
      }
    }

    const data = await callAppSync<QueryResp>(reqId, LIST_REFERRALS_ADMIN, {
      limit,
      nextToken: null,
    })

    const items = data.listReferrals?.items ?? []
    const nextToken = data.listReferrals?.nextToken ?? null

    logInfo(reqId, 'Loaded referrals from AppSync for admin', {
      count: items.length,
      nextToken,
      sample: items.slice(0, 3).map((r) => ({
        id: r.id,
        status: r.onboardingStatus,
        referralCode: r.referralCode,
        partnerId: r.partnerId,
      })),
    })

    const enriched = await enrichWithPartners(reqId, items)

    return res.status(200).json({
      ok: true,
      referrals: enriched,
      nextToken,
    })
  } catch (err: any) {
    logError(reqId, 'Unexpected error in admin-list handler', {
      message: err?.message,
      stack: err?.stack,
    })

    return res.status(500).json({
      error:
        err?.message ||
        'Unexpected server error while listing referrals (see server logs)',
    })
  }
}

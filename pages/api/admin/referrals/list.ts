// pages/api/admin/referrals/list.ts
import type { NextApiRequest, NextApiResponse } from 'next'

const APPSYNC_ENDPOINT = process.env.APPSYNC_GRAPHQL_ENDPOINT
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY
const debugReferrals = process.env.DEBUG_REFERRAL_INVITES === '1'

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

async function fetchAllReferrals() {
  if (!APPSYNC_ENDPOINT || !APPSYNC_API_KEY) {
    throw new Error('Missing AppSync configuration')
  }

  let nextToken: string | null = null
  const all: any[] = []
  const startedAt = Date.now()

  do {
    const resp = await fetch(APPSYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': APPSYNC_API_KEY,
      },
      body: JSON.stringify({
        query: LIST_REFERRALS_ADMIN,
        variables: {
          limit: 100,
          nextToken,
        },
      }),
    })

    const json = await resp.json()

    if (!resp.ok || json.errors) {
      throw new Error(
        json?.errors?.[0]?.message || `AppSync error: ${resp.status}`
      )
    }

    const pageItems = json?.data?.listReferrals?.items || []
    nextToken = json?.data?.listReferrals?.nextToken || null
    all.push(...pageItems)
  } while (nextToken)

  if (debugReferrals) {
    // eslint-disable-next-line no-console
    console.log('[admin/list] fetched referrals', {
      count: all.length,
      latencyMs: Date.now() - startedAt,
    })
  }

  // Sort newest first by createdAt if available
  all.sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0
    return bTime - aTime
  })

  return all
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const referrals = await fetchAllReferrals()
    return res.status(200).json({ referrals })
  } catch (err: any) {
    console.error('[admin/list] error fetching referrals', err)
    return res
      .status(500)
      .json({ error: err?.message || 'Failed to load referrals' })
  }
}

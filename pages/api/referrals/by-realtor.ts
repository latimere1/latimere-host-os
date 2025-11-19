// pages/api/referrals/by-realtor.ts
import type { NextApiRequest, NextApiResponse } from 'next'

const APPSYNC_ENDPOINT = process.env.APPSYNC_GRAPHQL_ENDPOINT
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY
const debugReferrals = process.env.DEBUG_REFERRAL_INVITES === '1'

const LIST_REFERRALS_BY_REALTOR = /* GraphQL */ `
  query ListReferralsByRealtor($realtorEmail: String!) {
    listReferrals(
      filter: { realtorEmail: { eq: $realtorEmail } }
      limit: 1000
    ) {
      items {
        id
        clientName
        clientEmail
        realtorName
        realtorEmail
        onboardingStatus
        payoutEligible
        payoutSent
        payoutMethod
        createdAt
        updatedAt
      }
    }
  }
`

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!APPSYNC_ENDPOINT || !APPSYNC_API_KEY) {
    console.error(
      '[by-realtor] Missing APPSYNC env vars',
      !!APPSYNC_ENDPOINT,
      !!APPSYNC_API_KEY
    )
    return res.status(500).json({ error: 'Server not configured' })
  }

  const email = (req.query.email as string | undefined)?.trim().toLowerCase()

  if (!email) {
    return res.status(400).json({ error: 'Missing realtor email' })
  }

  const startedAt = Date.now()

  try {
    if (debugReferrals) {
      // eslint-disable-next-line no-console
      console.log('[by-realtor] Fetching referrals for realtor', { email })
    }

    const resp = await fetch(APPSYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': APPSYNC_API_KEY,
      },
      body: JSON.stringify({
        query: LIST_REFERRALS_BY_REALTOR,
        variables: { realtorEmail: email },
      }),
    })

    const json = await resp.json()

    if (!resp.ok || json.errors) {
      console.error('[by-realtor] AppSync error', {
        status: resp.status,
        errors: json.errors,
      })
      return res
        .status(500)
        .json({ error: 'Failed to load referrals for this realtor' })
    }

    const items = json?.data?.listReferrals?.items || []

    if (debugReferrals) {
      // eslint-disable-next-line no-console
      console.log('[by-realtor] Loaded referrals', {
        email,
        count: items.length,
        latencyMs: Date.now() - startedAt,
      })
    }

    return res.status(200).json({ referrals: items })
  } catch (err: any) {
    console.error('[by-realtor] Unexpected error', err)
    return res
      .status(500)
      .json({ error: err?.message || 'Unexpected error loading referrals' })
  }
}

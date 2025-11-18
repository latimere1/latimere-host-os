// pages/api/referrals/by-token.ts
import type { NextApiRequest, NextApiResponse } from 'next'

const debugReferrals = process.env.DEBUG_REFERRAL_INVITES === '1'

const APPSYNC_ENDPOINT = process.env.APPSYNC_GRAPHQL_ENDPOINT!
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY!

const referralByInviteTokenQuery = /* GraphQL */ `
  query ReferralByInviteToken($inviteToken: String!, $limit: Int) {
    referralByInviteToken(inviteToken: $inviteToken, limit: $limit) {
      items {
        id
        realtorName
        realtorEmail
        clientName
        clientEmail
        source
        onboardingStatus
        lastEmailSentAt
        lastEmailStatus
        createdAt
        updatedAt
      }
    }
  }
`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = String(req.query.token || '').trim()

  if (!token) {
    return res.status(400).json({ error: 'Missing token' })
  }

  try {
    if (debugReferrals) {
      console.log('[referrals:by-token] incoming', { token })
    }

    const gqlResponse = await fetch(APPSYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': APPSYNC_API_KEY,
      },
      body: JSON.stringify({
        query: referralByInviteTokenQuery,
        variables: {
          inviteToken: token,
          limit: 1,
        },
      }),
    })

    const gqlJson = await gqlResponse.json()

    if (gqlJson.errors) {
      console.error('[referrals:by-token] AppSync errors', gqlJson.errors)
      return res.status(500).json({ error: 'Failed to look up referral' })
    }

    const items = gqlJson.data?.referralByInviteToken?.items || []
    const referral = items[0]

    if (!referral) {
      if (debugReferrals) {
        console.log('[referrals:by-token] no referral found for token', { token })
      }
      return res.status(404).json({ error: 'Referral not found' })
    }

    if (debugReferrals) {
      console.log('[referrals:by-token] found referral', {
        id: referral.id,
        clientName: referral.clientName,
        realtorName: referral.realtorName,
        onboardingStatus: referral.onboardingStatus,
      })
    }

    // Return a sanitized payload
    return res.status(200).json({
      ok: true,
      referral,
    })
  } catch (err) {
    console.error('[referrals:by-token] unexpected error', err)
    return res.status(500).json({ error: 'Unexpected error looking up referral' })
  }
}

// lib/revenueClient.ts
/* eslint-disable no-console */
import { generateClient } from 'aws-amplify/api'

const debugRevenueClient =
  typeof window !== 'undefined' &&
  (process.env.NEXT_PUBLIC_DEBUG_REVENUE === '1' ||
    process.env.NEXT_PUBLIC_DEBUG_REFERRALS === '1')

let client: ReturnType<typeof generateClient> | null = null

export function getRevenueClient() {
  if (!client) {
    if (debugRevenueClient) {
      console.log('[RevenueClient] Creating client with authMode=apiKey')
    }

    client = generateClient({
      authMode: 'apiKey',
    })
  }

  return client
}

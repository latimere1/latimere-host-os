// pages/api/invitations/complete.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

/**
 * MVP endpoint:
 *  - hashes the raw token and returns tokenHash
 *  - lets the already-authenticated client do the AppSync mutations
 *    (createCleanerAffiliation, updateInvitation, etc.)
 *
 * Logs are prefixed with [complete-invite] for quick grep.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const { token } = (req.body || {}) as { token?: string }
    if (!token) {
      console.error('[complete-invite] 400 missing token')
      return res.status(400).json({ error: 'token is required' })
    }
    const tokenHash = crypto.createHash('sha256').update(token, 'utf8').digest('hex')
    console.log('[complete-invite] ok', { tokenPreview: token.slice(0, 6) + '…', tokenHash: tokenHash.slice(0, 8) + '…' })
    return res.status(200).json({ ok: true, tokenHash, serverTime: new Date().toISOString() })
  } catch (e: any) {
    console.error('[complete-invite] 500', e)
    return res.status(500).json({ error: e?.message || 'failed' })
  }
}

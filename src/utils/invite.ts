// utils/invite.ts
// Helpers used by the “Invite cleaner” flow.
//
// What this does:
// - makeInviteToken(): makes a strong random token + SHA-256 hash (we store only the hash)
// - createInvitationForCleaner(): writes an Invitation row via AppSync
// - sendInviteEmail(): hits your Next API route to email the invite link
//
// Logging: prefixed with [invite] so you can grep quickly.

import { generateClient } from 'aws-amplify/api'
import { getCurrentUser } from 'aws-amplify/auth'
import { createInvitation } from '@/src/graphql/mutations'

const client = generateClient({ authMode: 'userPool' })

/** Make a 256-bit random token (hex) and its SHA-256 hash (hex). */
export async function makeInviteToken(): Promise<{ token: string; tokenHash: string }> {
  const buf = new Uint8Array(32)
  crypto.getRandomValues(buf)
  const token = Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('') // 64 hex chars

  const enc = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', enc)
  const tokenHash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')

  console.log('[invite] makeInviteToken ok:', { tokenPreview: token.slice(0, 6) + '…', tokenHash: tokenHash.slice(0, 8) + '…' })
  return { token, tokenHash }
}

/** Create an Invitation row for this owner/admin and the given email. */
export async function createInvitationForCleaner(email: string, tokenHash: string) {
  const { userId: ownerSub, username } = await getCurrentUser()
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()

  console.log('[invite] createInvitationForCleaner start:', { ownerSub, inviter: username, email, expiresAt })

  const res = await client.graphql({
    query: createInvitation,
    variables: {
      input: {
        ownerSub,
        email,
        role: 'cleaner',
        tokenHash,
        status: 'PENDING',
        expiresAt,
      },
    },
    authMode: 'userPool',
  })

  console.log('[invite] createInvitationForCleaner res:', res)
  return res
}

/**
 * Ask the server to send the invite email containing the raw token link.
 * Your /api/invitations/send.ts should read { email, token } and use SES.
 * APP_URL should be set server-side to build the clickable URL.
 */
export async function sendInviteEmail(email: string, token: string) {
  console.log('[invite] sendInviteEmail -> /api/invitations/send', { email })
  const r = await fetch('/api/invitations/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    console.error('[invite] sendInviteEmail failed:', r.status, data)
    throw new Error(data?.error || 'Failed to send email')
  }
  console.log('[invite] sendInviteEmail ok:', data)
  return data
}

/** One-call helper used by your UI button: generates token, creates invite, emails it. */
export async function inviteCleaner(email: string) {
  try {
    const { token, tokenHash } = await makeInviteToken()
    await createInvitationForCleaner(email, tokenHash)
    await sendInviteEmail(email, token)
    console.log('[invite] inviteCleaner complete for', email)
    return { ok: true }
  } catch (e) {
    console.error('[invite] inviteCleaner error:', e)
    throw e
  }
}

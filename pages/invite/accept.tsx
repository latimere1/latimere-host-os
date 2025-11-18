// pages/invite/accept.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { generateClient } from 'aws-amplify/api'
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'
import { getUserProfile } from '@/src/graphql/queries'
import { createUserProfile } from '@/src/graphql/mutations'

type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'

type Invitation = {
  id: string
  email?: string | null
  role?: string | null
  status: InvitationStatus | string
  expiresAt?: string | null
  owner?: string | null         // inviter sub (how we saved it on the server)
  tokenHash?: string | null
}

const client = generateClient({ authMode: 'userPool' })

const log  = (...a: any[]) => console.log('[invite/accept]', ...a)
const warn = (...a: any[]) => console.warn('[invite/accept]', ...a)
const err  = (...a: any[]) => console.error('[invite/accept]', ...a)

export default function AcceptInvitePage() {
  const router = useRouter()

  const { id, token } = useMemo(() => {
    const q = router.query || {}
    return {
      id: (q.id as string) || '',
      token: (q.token as string) || '',
    }
  }, [router.query])

  const [authed, setAuthed] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [debug, setDebug] = useState<any>({})

  const note = (k: string, v: any) => setDebug((d: any) => ({ ...d, [k]: v }))

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const cu = await getCurrentUser()
        if (!mounted) return
        setAuthed(true)
        note('currentUser', { sub: cu.userId, username: cu.username })
        log('authed', cu)
      } catch (e) {
        if (!mounted) return
        setAuthed(false)
        warn('not signed in', e)
      }
    })()
    return () => { mounted = false }
  }, [])

  async function accept() {
    if (!id || !token) {
      setMessage('Missing id or token.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const { userId: sub, username } = await getCurrentUser()
      note('user', { sub, username })

      const session = await fetchAuthSession()
      const idToken = session.tokens?.idToken?.toString() || ''
      if (!idToken) {
        throw new Error('Missing idToken; please sign in again.')
      }
      note('hasIdToken', true)

      // 1) Hash the token (server-side util)
      const hRes = await fetch('/api/invitations/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const hJson = await hRes.json().catch(() => ({}))
      if (!hRes.ok || !hJson?.tokenHash) {
        err('token hash failed', hJson)
        throw new Error(hJson?.error || 'Could not prepare token.')
      }
      const tokenHash = hJson.tokenHash as string
      note('tokenHash', tokenHash.slice(0, 8) + '…')

      // 2) Fetch the invitation from server (consistent read)
      const lRes = await fetch('/api/invitations/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const lJson = await lRes.json().catch(() => ({}))
      if (!lRes.ok || !lJson?.invitation) {
        err('lookup failed', lJson)
        throw new Error(lJson?.error || 'Invite not found.')
      }
      const invite: Invitation = lJson.invitation
      note('invite', invite)

      // 3) Validate locally
      const status = String(invite.status || '')
      const notExpired = !invite.expiresAt || new Date(invite.expiresAt) > new Date()
      const matches = invite.tokenHash && tokenHash && invite.tokenHash === tokenHash
      note('validation', { status, notExpired, matches })
      if (!(status === 'PENDING' && notExpired && matches)) {
        const why =
          status !== 'PENDING' ? `status=${status}` : !notExpired ? 'expired' : 'token mismatch'
        throw new Error(`Invite not valid (${why}).`)
      }

      // 4) Ensure profile exists (best-effort; ignore AlreadyExists)
      try {
        await client.graphql({
          query: createUserProfile,
          variables: {
            input: {
              id: username,
              username,
              role: 'cleaner',
              hasPaid: false,
              owner: sub,
            },
          },
          authMode: 'userPool',
        })
        note('createUserProfile', 'ok')
      } catch (e: any) {
        warn('createUserProfile skipped/exists', e?.errors || e?.message || e)
        note('createUserProfile', 'exists-or-skip')
      }

      // 5) Finalize acceptance via API (sends raw JWT for server-side AppSync)
      const aRes = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          id: invite.id,
          tokenHash,
          ownerSub: invite.owner || null,
          cleanerUsername: username,
          cleanerDisplay: username,
        }),
      })
      const aJson = await aRes.json().catch(() => ({}))
      if (!aRes.ok || !aJson?.ok) {
        err('accept failed', aJson)
        throw new Error(aJson?.error || 'Accept failed.')
      }
      note('accept', aJson)

      // 6) Route based on role
      let role = 'cleaner'
      try {
        const r: any = await client.graphql({
          query: getUserProfile,
          variables: { id: username },
          authMode: 'userPool',
        })
        role = String(r?.data?.getUserProfile?.role || role).toLowerCase()
        note('role', role)
      } catch {
        /* default cleaner */
      }
      const dest = role === 'cleaner' ? '/cleanings' : '/properties'
      setMessage('✅ Invite accepted. Redirecting…')
      router.replace(dest)
    } catch (e: any) {
      const msg = e?.message || 'Something went wrong.'
      setMessage(`❌ ${msg}`)
      err(e)
    } finally {
      setBusy(false)
    }
  }

  // ——— Renders ———
  if (!id || !token) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui' }}>
        <h1>Accept Invite</h1>
        <p style={{ color: 'crimson' }}>Missing <code>id</code> or <code>token</code> in the URL.</p>
        <pre style={{ background: '#f6f6f6', padding: 12, fontSize: 12 }}>
          {JSON.stringify(router.query, null, 2)}
        </pre>
      </div>
    )
  }

  if (authed === false) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui' }}>
        <h1>Accept Invite</h1>
        <p>You need to sign in before accepting your invite.</p>
        <p>After signing in, return to this link—the token stays in the URL.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Accept Invite</h1>
      <p>This will link your account to the owner who invited you.</p>

      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <button
          onClick={accept}
          disabled={busy || authed === null}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #0ea5e9',
            background: '#06b6d4',
            color: '#0b1220',
            cursor: 'pointer',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Working…' : 'Accept Invite'}
        </button>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #334155',
            background: '#0b1220',
            color: '#e5e7eb',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>

      {message && (
        <p style={{ marginTop: 12 }}>
          {message}
        </p>
      )}

      <details style={{ marginTop: 18 }}>
        <summary>Debug</summary>
        <pre style={{ background: '#0b0f19', color: '#e5e7eb', padding: 12, borderRadius: 8, fontSize: 12 }}>
{`id: ${id}
token: ${token.slice(0, 6)}…
authed: ${String(authed)}
busy: ${String(busy)}
debug: ${JSON.stringify(debug, null, 2)}`}
        </pre>
      </details>
    </div>
  )
}

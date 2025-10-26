// pages/invite/accept.tsx
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { generateClient } from 'aws-amplify/api'
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'
import { getUserProfile } from '@/src/graphql/queries'
import { createUserProfile } from '@/src/graphql/mutations'

type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'
type Invitation = {
  id: string
  owner: string
  email: string
  role?: string
  status: InvitationStatus
  tokenHash?: string
  expiresAt?: string
  lastSentAt?: string
  createdAt?: string
  updatedAt?: string
}

const client = generateClient({ authMode: 'userPool' })

export default function AcceptInvitePage() {
  const router = useRouter()

  const q = useMemo(() => {
    const { id, token, email, role } = router.query || {}
    return {
      id: (id as string) || '',
      token: (token as string) || '',
      email: (email as string) || '',
      role: (role as string) || '',
    }
  }, [router.query])

  const [busy, setBusy] = useState(false)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [error, setError] = useState<string>('')
  const [dbg, setDbg] = useState<any>({})

  // Simple logger that also mirrors into dbg drawer
  const note = (k: string, v: any) =>
    setDbg((d: any) => ({ ...d, [k]: v }))

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        console.log('[accept] authed OK:', { username: u.username, sub: u.userId })
        setAuthed(true)
      })
      .catch((e) => {
        console.warn('[accept] not authed yet:', e)
        setAuthed(false)
      })
  }, [])

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  async function accept() {
    try {
      setBusy(true)
      setError('')

      console.log('[accept] parsed:', q)
      if (!q.id || !q.token) {
        setError('Missing id or token in URL.')
        return
      }

      // A) who is accepting?
      const { userId: sub, username } = await getCurrentUser()
      console.log('[accept] current user:', { sub, username })
      note('user', { sub, username })

      // B) get Cognito idToken (RAW JWT needed by AppSync at the server)
      const session = await fetchAuthSession()
      const idToken = session.tokens?.idToken?.toString() || ''
      console.log('[accept] got idToken?', { hasIdToken: !!idToken })
      note('hasIdToken', !!idToken)

      // C) hash the token via server util (keeps hash calc in one place)
      const hashResp = await fetch('/api/invitations/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: q.token }),
      })
      const hashJson = await hashResp.json().catch(() => ({}))
      if (!hashResp.ok || !hashJson?.tokenHash) {
        console.error('[accept] /complete failed:', hashJson)
        throw new Error(hashJson?.error || 'Failed to hash token.')
      }
      const tokenHash: string = hashJson.tokenHash
      console.log('[accept] token hashed via API:', { tokenHash: tokenHash.slice(0, 8) + '…' })
      note('tokenHash', tokenHash)

      // D) lookup invite from server (DDB ConsistentRead)
      // (retry once in case of very fresh write)
      console.log('[accept] using server-side /api/invitations/lookup')
      let invite: Invitation | null = null
      for (let attempt = 1; attempt <= 2; attempt++) {
        const resp = await fetch('/api/invitations/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: q.id }),
        })
        const js = await resp.json().catch(() => ({}))
        console.log(`[accept] server lookup (attempt ${attempt}) ->`, js)
        note(`lookupAttempt${attempt}`, js)
        invite = js?.invitation || js?.item || null
        if (invite) break
        await sleep(250)
      }

      // E) local validation (status/expiry/hash)
      if (!invite) throw new Error('Invite not found.')
      const status: InvitationStatus = invite.status
      const expiresAt = invite.expiresAt ? new Date(invite.expiresAt) : null
      const notExpired = !expiresAt || expiresAt > new Date()
      const matches = !!invite.tokenHash && !!tokenHash && invite.tokenHash === tokenHash
      console.log('[accept] validation →', { status, notExpired, matches })
      note('validation', { status, notExpired, matches })
      if (!(status === 'PENDING' && notExpired && matches)) {
        const why =
          status !== 'PENDING' ? `status=${status}` : !notExpired ? 'expired' : 'token mismatch'
        throw new Error(`Invite not valid (${why}).`)
      }

      // F) Best-effort: ensure profile exists (ignore AlreadyExists)
      try {
        const profRes = await client.graphql({
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
        console.log('[accept] createUserProfile ->', profRes)
        note('createUserProfile', 'ok')
      } catch (e: any) {
        console.warn('[accept] createUserProfile skipped/exists:', e?.errors || e?.message || e)
        note('createUserProfile', 'exists-or-skip')
      }

      // G) tell server to finish acceptance.
      //    Server will create affiliation (owner/ownerSub auto), then update invitation -> ACCEPTED.
      const payload = {
        id: invite.id,
        tokenHash,
        ownerSub: invite.owner,     // inviter sub saved on invitation.owner
        cleanerUsername: username,  // current user
        cleanerDisplay: username,
      }
      console.log('[accept] calling server accept with:', {
        ...payload,
        tokenHash: tokenHash.slice(0, 8) + '…',
      })
      note('acceptPayload', { ...payload, tokenHash: tokenHash.slice(0, 8) + '…' })

      const accResp = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Send "Bearer <idToken>" — the API strips the prefix and forwards the raw JWT to AppSync
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      })
      const accJson = await accResp.json().catch(() => ({}))
      if (!accResp.ok || !accJson?.ok) {
        console.error('[accept] server accept failed:', accJson)
        note('finalError', accJson)
        throw new Error(accJson?.error || 'Accept failed')
      }
      console.log('[accept] server accept ok:', accJson)
      note('acceptResult', accJson)

      // H) route based on current profile role
      let role = 'cleaner'
      try {
        const getRes: any = await client.graphql({
          query: getUserProfile,
          variables: { id: username },
          authMode: 'userPool',
        })
        role = getRes?.data?.getUserProfile?.role || role
        console.log('[accept] role lookup ->', role)
      } catch (e) {
        console.warn('[accept] getUserProfile failed (default role=cleaner):', e)
      }

      const dest = role?.toLowerCase() === 'cleaner' ? '/cleanings' : '/properties'
      console.log('[accept] redirect ->', dest)
      alert('✅ Invite accepted. Your account is now linked to the owner.')
      router.replace(dest)
    } catch (e: any) {
      const message =
        e?.message ||
        e?.errors?.[0]?.message ||
        (typeof e === 'string' ? e : JSON.stringify(e))
      console.error('[accept] ERROR:', e)
      setError(message)
      note('caught', message)
    } finally {
      setBusy(false)
    }
  }

  // Guards for bad URLs / not signed in yet
  if (!q.token || !q.id) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui' }}>
        <h1>Accept Invite</h1>
        <p style={{ color: 'crimson' }}>Missing id or token.</p>
        <pre style={{ background: '#f6f6f6', padding: 12, fontSize: 12 }}>
          query: {JSON.stringify(router.query, null, 2)}
        </pre>
      </div>
    )
  }

  if (authed === false) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui' }}>
        <h1>Accept Invite</h1>
        <p>You need to sign in or sign up before accepting your invite.</p>
        <p>After signing in, refresh this page (the token stays in the URL).</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Accept Invite</h1>
      <p>This will link your account to the owner who invited you.</p>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <button onClick={accept} disabled={busy} style={{ padding: 10 }}>
        {busy ? 'Linking…' : 'Accept Invite'}
      </button>

      {/* Debug drawer */}
      <pre style={{ marginTop: 16, background: '#f6f6f6', padding: 12, fontSize: 12 }}>
        token: {q.token ? q.token.slice(0, 6) + '…' : '(none)'}
        {'\n'}id: {q.id || '(none)'}
        {'\n'}authed: {String(authed)}
        {'\n'}busy: {String(busy)}
        {'\n'}query: {JSON.stringify(router.query, null, 2)}
        {'\n'}debug: {JSON.stringify(dbg, null, 2)}
      </pre>
    </div>
  )
}

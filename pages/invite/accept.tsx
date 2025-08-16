// pages/invite/accept.tsx
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { generateClient } from 'aws-amplify/api'
import { getCurrentUser } from 'aws-amplify/auth'

// Codegen’d operations (adjust paths/names if your codegen differs)
import { listInvitations, getUserProfile } from '@/src/graphql/queries'
import {
  createCleanerAffiliation,
  createUserProfile,
  updateInvitation,
} from '@/src/graphql/mutations'

const client = generateClient({ authMode: 'userPool' })

export default function AcceptInvitePage() {
  const router = useRouter()
  const token = useMemo(() => (router.query.token as string) || '', [router.query.token])

  const [busy, setBusy] = useState(false)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [error, setError] = useState<string>('')

  // Check auth on mount
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

  async function accept() {
    try {
      setBusy(true)
      setError('')

      if (!token) {
        setError('Missing token in URL.')
        console.warn('[accept] missing token in URL')
        return
      }

      // 1) Hash token on the server (no secrets client-side)
      const resp = await fetch('/api/invitations/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Failed to prepare invite')
      const { tokenHash, serverTime } = data
      console.log('[accept] token hashed:', {
        tokenPreview: token.slice(0, 6) + '…',
        tokenHash: tokenHash.slice(0, 8) + '…',
        serverTime,
      })

      // 2) Find pending, unexpired invitation
      const listRes: any = await client.graphql({
        query: listInvitations,
        variables: {
          filter: { tokenHash: { eq: tokenHash }, status: { eq: 'PENDING' } },
          limit: 10,
        },
        authMode: 'userPool',
      })
      const items = (listRes?.data?.listInvitations?.items || []).filter(Boolean)
      const now = new Date()
      const invite = items.find((i: any) => new Date(i.expiresAt) > now)
      console.log('[accept] invitations found:', {
        count: items.length,
        chosenId: invite?.id,
        ownerSub: invite?.ownerSub,
        expiresAt: invite?.expiresAt,
      })
      if (!invite) throw new Error('Invite not found, expired, or already accepted.')

      // 3) Get the current (accepting) user
      const { userId: sub, username } = await getCurrentUser()
      console.log('[accept] current user:', { sub, username })

      // 4) Upsert a cleaner profile (best-effort)
      try {
        const profRes = await client.graphql({
          query: createUserProfile,
          variables: {
            input: {
              id: username,
              username,
              role: 'cleaner',
              hasPaid: false,
              owner: sub, // satisfies @auth owner rule on UserProfile
            },
          },
          authMode: 'userPool',
        })
        console.log('[accept] createUserProfile ->', profRes)
      } catch (e: any) {
        // If it already exists, AppSync will throw; that's fine.
        console.warn('[accept] createUserProfile skipped/exists:', e?.errors || e)
      }

      // 5) Create the affiliation (ownerSub ↔ cleanerUsername)
      const affRes = await client.graphql({
        query: createCleanerAffiliation,
        variables: {
          input: {
            ownerSub: invite.ownerSub,
            cleanerUsername: username, // must match Cleaning.assignedTo usage
            cleanerDisplay: username,  // you can enhance with a proper display name later
          },
        },
        authMode: 'userPool',
      })
      console.log('[accept] createCleanerAffiliation ->', affRes)

      // 6) Mark invitation accepted
      const updRes = await client.graphql({
        query: updateInvitation,
        variables: { input: { id: invite.id, status: 'ACCEPTED' } },
        authMode: 'userPool',
      })
      console.log('[accept] updateInvitation(ACCEPTED) ->', updRes)

      // 7) Role‑based redirect
      // Try to read the user’s role (may be 'cleaner', 'owner', or 'admin')
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
      console.error('[accept] ERROR:', e)
      setError(e?.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  // UI states
  if (!token) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui' }}>
        <h1>Accept Invite</h1>
        <p style={{ color: 'crimson' }}>Missing token.</p>
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

      {/* Debug drawer for fast triage */}
      <pre style={{ marginTop: 16, background: '#f6f6f6', padding: 12, fontSize: 12 }}>
        token: {token ? token.slice(0, 6) + '…' : '(none)'}
        {'\n'}authed: {String(authed)}
        {'\n'}busy: {String(busy)}
      </pre>
    </div>
  )
}

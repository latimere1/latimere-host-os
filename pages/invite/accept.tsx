// pages/invite/accept.tsx
import * as React from 'react'
import { useRouter } from 'next/router'
import { generateClient } from 'aws-amplify/api'
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'
import { getUserProfile } from '@/src/graphql/queries'
import { createUserProfile } from '@/src/graphql/mutations'

type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'
type Invitation = {
  id: string
  email: string
  role?: string | null
  status: InvitationStatus | string
  expiresAt?: string | null
  owner?: string | null
  ownerSub?: string | null
  tokenHash?: string | null
}

const client = generateClient({ authMode: 'userPool' })

// ---------- small utils ----------
const log  = (...a: any[]) => console.log('[invite/accept]', ...a)
const warn = (...a: any[]) => console.warn('[invite/accept]', ...a)
const err  = (...a: any[]) => console.error('[invite/accept]', ...a)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ---------- page ----------
export default function AcceptInvitePage() {
  const router = useRouter()

  const q = React.useMemo(() => {
    const { id, token, email, role } = router.query || {}
    return {
      id: (id as string) || '',
      token: (token as string) || '',
      email: (email as string) || '',
      role: (role as string) || '',
    }
  }, [router.query])

  // state
  const [busy, setBusy] = React.useState(false)
  const [authed, setAuthed] = React.useState<boolean | null>(null)
  const [currentUser, setCurrentUser] = React.useState<{ sub: string; username: string } | null>(null)
  const [error, setError] = React.useState<string>('')
  const [info, setInfo] = React.useState<string>('')
  const [dbg, setDbg] = React.useState<Record<string, any>>({})

  const note = (k: string, v: any) => setDbg((d) => ({ ...d, [k]: v }))

  // auth check on mount/query change
  React.useEffect(() => {
    let ignore = false
    ;(async () => {
      log('mount', { q })
      try {
        const cu = await getCurrentUser()
        if (ignore) return
        setAuthed(true)
        setCurrentUser({ sub: cu.userId, username: cu.username })
        log('authed', { sub: cu.userId, username: cu.username })
      } catch (e) {
        if (ignore) return
        setAuthed(false)
        setCurrentUser(null)
        warn('not signed in yet', e)
      }
    })()
    return () => { ignore = true }
  }, [q.id, q.token])

  async function accept() {
    setBusy(true)
    setError('')
    setInfo('')

    try {
      if (!q.id || !q.token) {
        throw new Error('Missing id or token in the URL.')
      }

      // who is accepting?
      const { userId: sub, username } = await getCurrentUser()
      log('current user', { sub, username })
      note('user', { sub, username })

      // id token for backend
      const session = await fetchAuthSession()
      const idToken = session.tokens?.idToken?.toString() || ''
      if (!idToken) throw new Error('No id token available. Please sign in again.')
      note('hasIdToken', true)

      // hash token via server
      const hRes = await fetch('/api/invitations/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: q.token }),
      })
      const hJson = await hRes.json().catch(() => ({}))
      if (!hRes.ok || !hJson?.tokenHash) {
        err('hash/complete failed', hJson)
        throw new Error(hJson?.error || 'Could not hash invitation token.')
      }
      const tokenHash: string = hJson.tokenHash
      log('token hash ok', tokenHash.slice(0, 8) + '…')
      note('tokenHash', tokenHash)

      // server-side DDB lookup (strongly consistent)
      let invite: Invitation | null = null
      for (let attempt = 1; attempt <= 2; attempt++) {
        const lk = await fetch('/api/invitations/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: q.id }),
        })
        const j = await lk.json().catch(() => ({}))
        invite = (j?.invitation || j?.item || null) as Invitation | null
        note(`lookup${attempt}`, j)
        if (invite) break
        await sleep(250)
      }
      if (!invite) throw new Error('Invitation not found.')

      // validate
      const status = String(invite.status || '')
      const notExpired =
        !invite.expiresAt || new Date(invite.expiresAt).getTime() >= Date.now()
      const matches = !!invite.tokenHash && invite.tokenHash === tokenHash

      log('validate', { status, notExpired, matches })
      note('validate', { status, notExpired, matches })
      if (!(status === 'PENDING' && notExpired && matches)) {
        const why =
          status !== 'PENDING' ? `status=${status}` : !notExpired ? 'expired' : 'token mismatch'
        throw new Error(`Invite not valid (${why}).`)
      }

      // ensure profile (ignore if exists)
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
        note('createUserProfile', { ok: true, id: username })
        log('createUserProfile ok', profRes)
      } catch (e: any) {
        warn('createUserProfile exists/skip', e?.errors || e?.message || e)
        note('createUserProfile', { ok: false, reason: 'exists-or-skip' })
      }

      // finish acceptance on server
      const payload = {
        id: invite.id,
        tokenHash,
        ownerSub: invite.owner || invite.ownerSub || '',
        cleanerUsername: username,
        cleanerDisplay: username,
      }
      note('acceptPayload', { ...payload, tokenHash: tokenHash.slice(0, 8) + '…' })
      const aRes = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(payload),
      })
      const aJson = await aRes.json().catch(() => ({}))
      if (!aRes.ok || !aJson?.ok) {
        err('accept failed', aJson)
        throw new Error(aJson?.error || 'Acceptance failed.')
      }
      note('acceptResult', aJson)
      setInfo('✅ Invite accepted. Redirecting…')

      // route based on role
      let role = 'cleaner'
      try {
        const r: any = await client.graphql({
          query: getUserProfile,
          variables: { id: username },
          authMode: 'userPool',
        })
        role = String(r?.data?.getUserProfile?.role || role).toLowerCase()
      } catch {
        /* noop */
      }
      const dest = role === 'cleaner' ? '/cleanings' : '/properties'
      log('redirect ->', dest)
      router.replace(dest)
    } catch (e: any) {
      const message =
        e?.message || e?.errors?.[0]?.message || (typeof e === 'string' ? e : 'Unexpected error')
      setError(message)
      note('error', message)
      err(message)
    } finally {
      setBusy(false)
    }
  }

  // ---------- render ----------
  if (!q.id || !q.token) {
    return (
      <main className="min-h-screen bg-gray-950 text-white px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-semibold">Accept Invite</h1>
          <p className="mt-2 text-red-300">Missing <code>id</code> or <code>token</code> in the URL.</p>
          <pre className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs">
            {JSON.stringify(router.query, null, 2)}
          </pre>
        </div>
      </main>
    )
  }

  if (authed === false) {
    return (
      <main className="min-h-screen bg-gray-950 text-white px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-semibold">Accept Invite</h1>
          <p className="mt-2 text-gray-300">
            Please sign in first. After signing in, return to this page — your token will still be in
            the URL.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold">Accept Invite</h1>
        <p className="text-gray-300">
          This will link your account to the owner who invited you.
        </p>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}
        {info && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {info}
          </div>
        )}

        <button
          onClick={accept}
          disabled={busy || authed === null}
          className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-gray-900 hover:bg-cyan-400 disabled:opacity-60"
        >
          {busy ? 'Accepting…' : 'Accept Invite'}
        </button>

        {/* Debug drawer */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-400">Debug</summary>
          <pre className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs overflow-auto">
{JSON.stringify(
  {
    query: q,
    authed,
    currentUser,
    busy,
    dbg,
  },
  null,
  2
)}
          </pre>
        </details>
      </div>
    </main>
  )
}

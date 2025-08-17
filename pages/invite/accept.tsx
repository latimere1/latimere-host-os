// pages/invite/accept.tsx
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { generateClient } from 'aws-amplify/api'
import { getCurrentUser, signOut } from 'aws-amplify/auth'
import Layout from '@/src/components/Layout'

// Codegen’d ops (adjust paths if your codegen differs)
import {
  listInvitations,
  getInvitation,
  getUserProfile,
} from '@/src/graphql/queries'
import {
  createCleanerAffiliation,
  createUserProfile,
  updateInvitation,
} from '@/src/graphql/mutations'

const client = generateClient({ authMode: 'userPool' })

type Invitation = {
  id: string
  email: string
  role?: string | null
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | string
  expiresAt?: string | null
  // Your schema stores the owner’s Cognito sub in either `owner` (common w/ @auth owner) or `ownerSub`
  owner?: string | null
  ownerSub?: string | null
  tokenHash?: string | null
}

// ---------- small utils ----------
const log  = (...a: any[]) => console.log('[accept]', ...a)
const warn = (...a: any[]) => console.warn('[accept]', ...a)
const err  = (...a: any[]) => console.error('[accept]', ...a)

const isExpired = (iso?: string | null) =>
  !!iso && new Date(iso).getTime() < Date.now()

function softAtob(input: string) {
  try {
    return atob(input.replace(/-/g, '+').replace(/_/g, '/'))
  } catch {
    return ''
  }
}
function readTokenPayload(token?: string) {
  if (!token) return null
  const [b64] = token.split('.')
  if (!b64) return null
  try {
    return JSON.parse(softAtob(b64)) as { id?: string; email?: string; role?: string; exp?: string }
  } catch {
    return null
  }
}

// ---------- page ----------
export default function AcceptInvitePage() {
  const router = useRouter()
  const { id: qId, email: qEmail, role: qRole } = (router.query as any) || {}

  const token = useMemo(
    () => (router.query?.token as string) || '',
    [router.query?.token]
  )
  const tokenPayload = useMemo(() => readTokenPayload(token), [token])

  const [busy, setBusy] = useState(false)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [msg, setMsg] = useState<string>('')

  const [currentUser, setCurrentUser] = useState<{ userId: string; username: string } | null>(null)
  const [invite, setInvite] = useState<Invitation | null>(null)

  // Preload auth and (optionally) the invitation (for banner/debug)
  useEffect(() => {
    ;(async () => {
      log('mount | query:', {
        id: qId, qEmail, qRole, hasToken: !!token,
        tokenPreview: token ? token.slice(0, 10) + '…' : '(none)',
      })
      try {
        const cu = await getCurrentUser()
        setAuthed(true)
        setCurrentUser({ userId: cu.userId, username: cu.username })
        log('authed OK:', { sub: cu.userId, username: cu.username })
      } catch (e) {
        setAuthed(false)
        setCurrentUser(null)
        warn('not signed in yet', e)
      }

      // If we have an ID, fetch the invite for early UX/error surface (final checks happen in accept())
      if (qId) {
        try {
          const res: any = await client.graphql({
            query: getInvitation,
            variables: { id: qId },
            authMode: 'userPool',
          })
          const inv: Invitation | null = res?.data?.getInvitation ?? null
          setInvite(inv)
          log('prefetch getInvitation:', inv)
        } catch (e) {
          warn('prefetch getInvitation failed (non-blocking):', e)
        }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qId, token])

  const acceptingEmail = String(qEmail || tokenPayload?.email || '').toLowerCase()
  const signedInEmail = String(currentUser?.username || '').toLowerCase()
  const mustSwitchAccount =
    authed === true &&
    acceptingEmail &&
    signedInEmail &&
    acceptingEmail !== signedInEmail

  async function accept() {
    setBusy(true)
    setMsg('')
    try {
      // 0) Must be signed in
      if (!authed) {
        setMsg('Please sign in or sign up before accepting your invite.')
        return
      }

      // 1) Resolve the target invitation
      let inv: Invitation | null = null
      let via = 'unknown'

      if (token) {
        // 1a) Securely hash token on the server (keeps secret off the client)
        const resp = await fetch('/api/invitations/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await resp.json().catch(() => ({}))
        if (!resp.ok || !data?.tokenHash) {
          throw new Error(
            data?.error || 'Could not verify invite token on the server.'
          )
        }
        const tokenHash: string = data.tokenHash
        log('token hashed:', {
          tokenPreview: token.slice(0, 8) + '…',
          tokenHashPreview: tokenHash.slice(0, 8) + '…',
        })

        // 1b) Find pending, unexpired invite by tokenHash
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
        inv = items.find((i: Invitation) => !isExpired(i.expiresAt)) || null
        via = 'tokenHash'
      } else if (qId) {
        // Fallback: allow legacy links w/ id
        const getRes: any = await client.graphql({
          query: getInvitation,
          variables: { id: qId },
          authMode: 'userPool',
        })
        inv = getRes?.data?.getInvitation ?? null
        via = 'id'
      }

      log('invite resolved via', via, '->', inv)
      if (!inv) throw new Error('Invite not found, expired, or already accepted.')
      if (inv.status !== 'PENDING') throw new Error('This invite is not pending.')
      if (isExpired(inv.expiresAt)) throw new Error('This invite link has expired.')

      // 2) Enforce "invited email === signed-in user" (prevents wrong-account acceptance)
      const invitedEmail = String(inv.email || '').toLowerCase()
      if (invitedEmail && signedInEmail && invitedEmail !== signedInEmail) {
        throw new Error(
          `This invite is for ${invitedEmail}, but you are signed in as ${signedInEmail}. Please sign out and sign in with the invited email.`
        )
      }

      // 3) Current user (accepting cleaner)
      const { userId: sub, username } = await getCurrentUser()
      log('current user:', { sub, username })

      // 4) Ensure a UserProfile exists for the cleaner (idempotent)
      try {
        const profRes = await client.graphql({
          query: createUserProfile,
          variables: {
            input: {
              id: username,
              username,
              role: 'cleaner',
              hasPaid: false,
              owner: sub, // satisfies common @auth(owner) on UserProfile
            },
          },
          authMode: 'userPool',
        })
        log('createUserProfile ->', profRes)
      } catch (e: any) {
        // If it already exists, AppSync throws; that’s fine.
        warn('createUserProfile skipped/exists:', e?.errors || e)
      }

      // 5) Create the affiliation (the durable part that drives the dropdown)
      const ownerSub = inv.owner || inv.ownerSub // support either field name
      if (!ownerSub) {
        warn('Invitation missing owner/ownerSub; cannot create affiliation.')
        throw new Error('Invite accepted, but could not determine owner. Contact support.')
      }

      const affRes = await client.graphql({
        query: createCleanerAffiliation,
        variables: {
          input: {
            ownerSub,                // <-- owner’s Cognito sub (drives listAffiliationsByOwner)
            cleanerUsername: username, // <-- matches Cleaning.assignedTo
            cleanerDisplay: username,
            // If your model also requires `owner` for @auth(owner), include it:
            owner: sub,
          },
        },
        authMode: 'userPool',
      })
      log('createCleanerAffiliation ->', affRes)

      // 6) Mark the invite accepted (idempotent)
      const updRes = await client.graphql({
        query: updateInvitation,
        variables: { input: { id: inv.id, status: 'ACCEPTED' } },
        authMode: 'userPool',
      })
      log('updateInvitation(ACCEPTED) ->', updRes)

      // 7) Determine destination
      let role = String(inv.role || qRole || 'cleaner').toLowerCase()
      try {
        const getRes: any = await client.graphql({
          query: getUserProfile,
          variables: { id: username },
          authMode: 'userPool',
        })
        role = String(getRes?.data?.getUserProfile?.role || role).toLowerCase()
        log('role lookup ->', role)
      } catch (e) {
        warn('getUserProfile failed; default role=cleaner', e)
      }

      const dest = role === 'cleaner' ? '/cleanings' : '/properties'
      log('redirect ->', dest)
      alert('✅ Invite accepted. Your account is now linked to the owner.')
      router.replace(dest)
    } catch (e: any) {
      err('ERROR:', e)
      setMsg(e?.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold">Accept Invite</h1>
        <p className="text-gray-600">This will link your account to the owner who invited you.</p>

        {!!msg && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {msg}
          </div>
        )}

        {/* Account mismatch helper */}
        {mustSwitchAccount && (
          <div className="rounded border bg-yellow-50 p-3 text-sm">
            You’re signed in as <b>{signedInEmail}</b>, but this invite is for{' '}
            <b>{acceptingEmail}</b>. Please sign out and sign in with the invited email.
            <div className="mt-2">
              <button
                className="px-3 py-1 rounded bg-gray-200"
                onClick={async () => {
                  await signOut()
                  location.reload()
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={accept}
            disabled={busy || authed === false || mustSwitchAccount}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
          >
            {busy ? 'Accepting…' : 'Accept Invite'}
          </button>
        </div>

        {/* Debug drawer for fast triage */}
        <pre className="mt-4 bg-gray-50 p-3 text-xs text-gray-700 overflow-x-auto">
{`id: ${qId || '(none)'}
email(query|token): ${acceptingEmail || '(none)'}
role(query|token): ${qRole || tokenPayload?.role || '(none)'}
token: ${token ? token.slice(0, 12) + '…' : '(none)'}
authed: ${String(authed)}
signed in as: ${signedInEmail || '(anonymous)'}
invite(prefetch): ${invite ? JSON.stringify({ id: invite.id, status: invite.status, exp: invite.expiresAt, owner: invite.owner || invite.ownerSub }, null, 2) : '(none)'}`}
        </pre>
      </div>
    </Layout>
  )
}

// pages/cleaners/index.tsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import { generateClient } from 'aws-amplify/api'
import { getCurrentUser } from 'aws-amplify/auth'
import Layout from '@/src/components/Layout'
import { withRole } from '@/src/components/withRole'

// GraphQL ops (Amplify codegen)
import {
  listInvitations,
  listCleanerAffiliations,
} from '@/src/graphql/queries'
import {
  createInvitation,
  updateInvitation,
  deleteInvitation,
  updateCleanerAffiliation,
  deleteCleanerAffiliation,
} from '@/src/graphql/mutations'

// ───────────────────────────────────────────────────────────
// Types — align with schema.graphql
type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'
type AffiliationStatus = 'ACTIVE' | 'REVOKED'

interface Invitation {
  id: string
  email: string
  owner: string                 // Cognito sub (tenant)
  role?: string | null
  status: InvitationStatus
  tokenHash?: string | null
  lastSentAt?: string | null
  expiresAt?: string | null
  createdAt?: string
  updatedAt?: string
}

interface CleanerAffiliation {
  id: string
  owner: string                 // Cognito sub (tenant)
  cleanerUsername: string
  cleanerDisplay?: string | null
  status: AffiliationStatus
  createdAt?: string
  updatedAt?: string
}

const client = generateClient({ authMode: 'userPool' })

// Pull out useful GraphQL error text (so you see real AppSync messages)
function extractGraphQLError(err: any): string {
  try {
    if (err?.errors?.[0]?.message) return err.errors[0].message
    if (err?.data && err?.errors) return JSON.stringify(err.errors, null, 2)
    if (err?.message) return err.message
    return JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
  } catch {
    return String(err)
  }
}

function isoPlusDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

// Small uuid helper (works in browsers + Node 18+)
function makeToken(): string {
  try {
    // modern browsers / runtime
    // @ts-ignore
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  } catch {}
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function ManageCleanersPage() {
  const [ownerSub, setOwnerSub] = useState<string | null>(null)   // use Cognito sub everywhere
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Invitations
  const [invites, setInvites] = useState<Invitation[]>([])
  const [inviteEmail, setInviteEmail] = useState('')

  // Affiliations
  const [affiliations, setAffiliations] = useState<CleanerAffiliation[]>([])

  // ───────────────────────────────────────────────────────────
  // Init current user
  useEffect(() => {
    ;(async () => {
      try {
        const user = await getCurrentUser()
        console.log('👤 getCurrentUser():', user)
        // Amplify returns { userId: sub, username: cognito:username }
        setOwnerSub(user?.userId ?? null)
        setOwnerUsername(user?.username ?? null)
      } catch (err) {
        console.error('❌ getCurrentUser failed:', err)
      }
    })()
  }, [])

  // ───────────────────────────────────────────────────────────
  // Load data
  const fetchAll = useCallback(async () => {
    if (!ownerSub) return
    setLoading(true)
    try {
      console.log('📥 Loading invites & affiliations for ownerSub:', ownerSub)

      const [invRes, affRes] = await Promise.all([
        client.graphql({
          query: listInvitations,
          variables: { filter: { owner: { eq: ownerSub } }, limit: 200 },
          authMode: 'userPool',
        }),
        client.graphql({
          query: listCleanerAffiliations,
          variables: { filter: { owner: { eq: ownerSub } }, limit: 200 },
          authMode: 'userPool',
        }),
      ])

      const invItems = invRes?.data?.listInvitations?.items ?? []
      const affItems = affRes?.data?.listCleanerAffiliations?.items ?? []
      console.log('✅ invitations raw:', invItems)
      console.log('✅ affiliations raw:', affItems)

      setInvites(invItems.filter((i: any) => i && i.id && i.email))
      setAffiliations(affItems.filter((a: any) => a && a.id && a.cleanerUsername))
    } catch (err: any) {
      const msg = extractGraphQLError(err)
      console.error('❌ Error loading data:', msg, err)
    } finally {
      setLoading(false)
    }
  }, [ownerSub])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ───────────────────────────────────────────────────────────
  // Derived groupings
  const pendingInvites = useMemo(() => invites.filter(i => i.status === 'PENDING'), [invites])
  const closedInvites  = useMemo(() => invites.filter(i => i.status !== 'PENDING'), [invites])
  const activeAffiliations  = useMemo(() => affiliations.filter(a => a.status === 'ACTIVE'), [affiliations])
  const revokedAffiliations = useMemo(() => affiliations.filter(a => a.status === 'REVOKED'), [affiliations])

  // ───────────────────────────────────────────────────────────
  // Actions — Invites
  const sendInvite = async () => {
    if (!ownerSub) return
    const email = inviteEmail.trim().toLowerCase()
    if (!email) return alert('Enter an email first.')

    try {
      console.log('✉️ Creating invitation for:', email)

      // IMPORTANT: tokenHash is required by the schema (String!)
      const tokenHash = makeToken()

      const res: any = await client.graphql({
        query: createInvitation,
        variables: {
          input: {
            email,
            owner: ownerSub,                 // schema uses "owner" (Cognito sub)
            role: 'cleaner',
            status: 'PENDING',
            tokenHash,                       // <-- non-null now
            lastSentAt: new Date().toISOString(),
            expiresAt: isoPlusDays(7),
          },
        },
        authMode: 'userPool',
      })
      console.log('✅ Invitation created:', res)
      setInviteEmail('')
      await fetchAll()
    } catch (err: any) {
      const msg = extractGraphQLError(err)
      console.error('❌ Failed to create invitation:', msg, err)
      alert(`Create invitation failed: ${msg}`)
    }
  }

const resendInvite = async (inv: Invitation) => {
  try {
    console.log('🔁 Resending invitation:', inv.id, inv.email)
    const now = new Date(Date.now() + Math.floor(Math.random() * 1000)).toISOString()

    const res: any = await client.graphql({
      query: updateInvitation,
      variables: { input: { id: inv.id, lastSentAt: now, status: 'PENDING' } },
      authMode: 'userPool',
    })
    console.log('✅ Invitation resent (updated):', res)
    await fetchAll()
  } catch (err: any) {
    const msg = extractGraphQLError(err)
    console.error('❌ Failed to resend invitation:', msg, err)
    alert(`Resend failed: ${msg}`)
  }
}

  const revokeInvite = async (inv: Invitation) => {
    if (!confirm(`Revoke invite for ${inv.email}?`)) return
    try {
      console.log('🛑 Revoking invitation:', inv.id)
      const res: any = await client.graphql({
        query: updateInvitation,
        variables: { input: { id: inv.id, status: 'REVOKED' } },
        authMode: 'userPool',
      })
      console.log('✅ Invitation revoked:', res)
      await fetchAll()
    } catch (err: any) {
      const msg = extractGraphQLError(err)
      console.error('❌ Failed to revoke invitation:', msg, err)
      alert(`Revoke failed: ${msg}`)
    }
  }

  // ───────────────────────────────────────────────────────────
  // Actions — Affiliations
  const revokeAffiliation = async (aff: CleanerAffiliation) => {
    if (!confirm(`Revoke affiliation for ${aff.cleanerUsername}?`)) return
    try {
      console.log('🧹 Revoking affiliation:', aff.id)
      const res: any = await client.graphql({
        query: updateCleanerAffiliation,
        variables: { input: { id: aff.id, status: 'REVOKED' } },
        authMode: 'userPool',
      })
      console.log('✅ Affiliation revoked:', res)
      await fetchAll()
    } catch (err: any) {
      const msg = extractGraphQLError(err)
      console.error('❌ Failed to revoke affiliation:', msg, err)
      alert(`Revoke affiliation failed: ${msg}`)
    }
  }

  const deleteAffiliation = async (aff: CleanerAffiliation) => {
    if (!confirm(`Permanently delete affiliation for ${aff.cleanerUsername}?`)) return
    try {
      console.log('🗑️ Deleting affiliation:', aff.id)
      const res: any = await client.graphql({
        query: deleteCleanerAffiliation,
        variables: { input: { id: aff.id } },
        authMode: 'userPool',
      })
      console.log('✅ Affiliation deleted:', res)
      await fetchAll()
    } catch (err: any) {
      const msg = extractGraphQLError(err)
      console.error('❌ Failed to delete affiliation:', msg, err)
      alert(`Delete affiliation failed: ${msg}`)
    }
  }

  // ───────────────────────────────────────────────────────────
  // UI
  return (
    <Layout title="Manage Cleaners">
      <div className="px-4 py-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Manage Cleaners</h1>

        {/* New Invite */}
        <div className="border rounded-xl p-4 mb-6">
          <h2 className="font-medium mb-2">Invite a Cleaner</h2>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="cleaner@email.com"
              className="border rounded px-3 py-2 w-full"
            />
            <button
              onClick={sendInvite}
              className="bg-black text-white rounded px-4 py-2"
            >
              Send Invite
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            We’ll email a sign‑up link. When accepted, they’ll be affiliated to your account automatically.
          </p>
          {ownerUsername && (
            <p className="text-xs text-gray-400 mt-1">
              Signed in as <span className="font-mono">{ownerUsername}</span>
            </p>
          )}
        </div>

        {/* Data states */}
        {loading ? (
          <div>Loading…</div>
        ) : (
          <>
            {/* Pending Invites */}
            <section className="mb-8">
              <h2 className="font-medium mb-2">Pending Invites</h2>
              {pendingInvites.length === 0 ? (
                <div className="text-sm text-gray-500">No pending invites.</div>
              ) : (
                <table className="w-full text-sm border rounded overflow-hidden">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="p-2">Email</th>
                      <th className="p-2">Last Sent</th>
                      <th className="p-2">Expires</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingInvites.map((inv) => (
                      <tr key={inv.id} className="border-t">
                        <td className="p-2">{inv.email}</td>
                        <td className="p-2">{inv.lastSentAt ?? '—'}</td>
                        <td className="p-2">{inv.expiresAt ?? '—'}</td>
                        <td className="p-2 flex gap-2">
                          <button onClick={() => resendInvite(inv)} className="border rounded px-3 py-1">
                            Resend
                          </button>
                          <button onClick={() => revokeInvite(inv)} className="border rounded px-3 py-1">
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Closed Invites */}
            <section className="mb-8">
              <h2 className="font-medium mb-2">Closed Invites</h2>
              {closedInvites.length === 0 ? (
                <div className="text-sm text-gray-500">No closed invites.</div>
              ) : (
                <table className="w-full text-sm border rounded overflow-hidden">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="p-2">Email</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closedInvites.map((inv) => (
                      <tr key={inv.id} className="border-t">
                        <td className="p-2">{inv.email}</td>
                        <td className="p-2">{inv.status}</td>
                        <td className="p-2">{inv.updatedAt ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Active Affiliations */}
            <section className="mb-8">
              <h2 className="font-medium mb-2">Active Affiliations</h2>
              {activeAffiliations.length === 0 ? (
                <div className="text-sm text-gray-500">No active cleaners yet.</div>
              ) : (
                <table className="w-full text-sm border rounded overflow-hidden">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="p-2">Cleaner Username</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Since</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAffiliations.map((aff) => (
                      <tr key={aff.id} className="border-t">
                        <td className="p-2">{aff.cleanerUsername}</td>
                        <td className="p-2">{aff.status}</td>
                        <td className="p-2">{aff.createdAt ?? '—'}</td>
                        <td className="p-2 flex gap-2">
                          <button onClick={() => revokeAffiliation(aff)} className="border rounded px-3 py-1">
                            Revoke
                          </button>
                          <button onClick={() => deleteAffiliation(aff)} className="border rounded px-3 py-1">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Revoked Affiliations */}
            <section className="mb-8">
              <h2 className="font-medium mb-2">Revoked Affiliations</h2>
              {revokedAffiliations.length === 0 ? (
                <div className="text-sm text-gray-500">None.</div>
              ) : (
                <table className="w-full text-sm border rounded overflow-hidden">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="p-2">Cleaner Username</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revokedAffiliations.map((aff) => (
                      <tr key={aff.id} className="border-t">
                        <td className="p-2">{aff.cleanerUsername}</td>
                        <td className="p-2">{aff.status}</td>
                        <td className="p-2">{aff.updatedAt ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </div>
    </Layout>
  )
}

export default withRole(['owner', 'admin'])(ManageCleanersPage)

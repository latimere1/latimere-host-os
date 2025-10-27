// pages/units/[id]/index.tsx
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { gql } from '@/src/lib/apiClient'
import { getCurrentUser } from 'aws-amplify/auth'

// GraphQL
import {
  getUnit,
  listCleanings,
  // Prefer this if your schema/codegen includes it (GSI by owner).
  // If it's not available in your API, we'll fall back to a standard list with filter.
  listAffiliationsByOwner,
} from '@/src/graphql/queries'
import {
  updateUnit,
  deleteUnit,
  createCleaning,
  updateCleaning,
  deleteCleaning,
} from '@/src/graphql/mutations'

// UI / types
import Layout from '@/src/components/Layout'
import { withRole } from '@/src/components/withRole'
import type { Cleaning } from '@/types/Cleaning'
import type { Unit as UnitType } from '@/types/Property'

// ------------------------------
// Types
// ------------------------------
type CleanerOption = {
  id: string
  username: string
  display?: string | null
}

// Fallback raw queries (cover both possible owner field names)
const LIST_CLEANER_AFFILIATIONS_FALLBACK_OWNER = /* GraphQL */ `
  query ListCleanerAffiliationsByOwner(
    $filter: ModelCleanerAffiliationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCleanerAffiliations(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        owner
        cleanerUsername
        cleanerDisplay
      }
      nextToken
    }
  }
`

const LIST_CLEANER_AFFILIATIONS_FALLBACK_OWNERSUB = /* GraphQL */ `
  query ListCleanerAffiliationsByOwnerSub(
    $filter: ModelCleanerAffiliationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCleanerAffiliations(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        ownerSub
        cleanerUsername
        cleanerDisplay
      }
      nextToken
    }
  }
`

function UnitDetailPage() {
  const router = useRouter()
  const rawId = router.query.id
  const unitId =
    typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : ''

  const log = (...a: any[]) => console.log('[UnitDetail]', ...a)
  const warn = (...a: any[]) => console.warn('[UnitDetail]', ...a)
  const err = (...a: any[]) => console.error('[UnitDetail]', ...a)

  // Unit state
  const [unit, setUnit] = useState<UnitType | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [name, setName] = useState('')
  const [sleeps, setSleeps] = useState<number | ''>('')
  const [price, setPrice] = useState<number | ''>('')

  // Cleanings state
  const [cleanings, setCleanings] = useState<Cleaning[]>([])
  const [cleaningDate, setCleaningDate] = useState('') // yyyy-mm-dd
  const [assignedTo, setAssignedTo] = useState('') // cleanerUsername (email)
  const [cleaningStatus, setCleaningStatus] =
    useState<'Scheduled' | 'Completed' | 'Missed'>('Scheduled')
  const [editingCleaning, setEditingCleaning] = useState<Cleaning | null>(null)

  // Cleaners via affiliations
  const [cleanersList, setCleanersList] = useState<CleanerOption[]>([])
  const [fetchingCleaners, setFetchingCleaners] = useState(false)

  // ------------------------------
  // Loaders
  // ------------------------------
  const fetchUnit = async () => {
    if (!unitId) return
    log('fetchUnit() unitId=', unitId)
    try {
      const res: any = await gql.graphql({ query: getUnit, variables: { id: unitId } })
      log('getUnit response:', res)
      const u = res?.data?.getUnit
      if (!u) {
        warn('No unit returned for id', unitId)
        return
      }
      setUnit(u)
      setName(u.name ?? '')
      setSleeps(typeof u.sleeps === 'number' ? u.sleeps : '')
      setPrice(typeof u.price === 'number' ? u.price : '')
    } catch (e) {
      err('Error fetching unit:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchCleaningsForUnit = async () => {
    if (!unitId) return
    log('fetchCleaningsForUnit() unitId=', unitId)
    try {
      const res: any = await gql.graphql({
        query: listCleanings,
        variables: { filter: { unitID: { eq: unitId } }, limit: 500 },
      })
      log('listCleanings response:', res)
      const items = res?.data?.listCleanings?.items ?? []
      setCleanings(items.filter(Boolean))
    } catch (e) {
      err('Error fetching cleanings:', e)
    }
  }

  const fetchCleaners = async () => {
    log('fetchCleaners() via CleanerAffiliation starting…')
    setFetchingCleaners(true)
    try {
      const { userId: ownerSub, username } = await getCurrentUser()
      log('current ownerSub for affiliations:', { ownerSub, username })

      let items: any[] = []

      // 1) Try the owner-indexed query first (fast; correct arg name is "owner")
      try {
        // IMPORTANT: listAffiliationsByOwner expects { owner: String! }
        const res: any = await gql.graphql({
          query: listAffiliationsByOwner as any,
          variables: { owner: ownerSub, limit: 1000 },
        })
        log('listAffiliationsByOwner response:', res)
        items = res?.data?.listAffiliationsByOwner?.items ?? []
      } catch (e: any) {
        const msg = e?.errors?.[0]?.message || String(e)
        warn(
          'listAffiliationsByOwner not available or failed — falling back to filter. msg:',
          msg
        )

        // 2) Fallback A: list with filter { owner: { eq: ownerSub } }
        try {
          const resA: any = await gql.graphql({
            query: LIST_CLEANER_AFFILIATIONS_FALLBACK_OWNER,
            variables: { filter: { owner: { eq: ownerSub } }, limit: 1000 },
          })
          log('listCleanerAffiliations (fallback OWNER) response:', resA)
          items = resA?.data?.listCleanerAffiliations?.items ?? []
        } catch (eA: any) {
          const msgA = eA?.errors?.[0]?.message || String(eA)
          warn('Fallback OWNER failed; will try OWNERSUB. msg:', msgA)

          // 3) Fallback B: list with filter { ownerSub: { eq: ownerSub } }
          const resB: any = await gql.graphql({
            query: LIST_CLEANER_AFFILIATIONS_FALLBACK_OWNERSUB,
            variables: { filter: { ownerSub: { eq: ownerSub } }, limit: 1000 },
          })
          log('listCleanerAffiliations (fallback OWNERSUB) response:', resB)
          items = resB?.data?.listCleanerAffiliations?.items ?? []
        }
      }

      const mapped: CleanerOption[] = (items || [])
        .filter(Boolean)
        .map((a: any) => ({
          id: a.cleanerUsername,
          username: a.cleanerUsername, // value stored in Cleaning.assignedTo
          display: a.cleanerDisplay ?? a.cleanerUsername,
        }))
        .sort((a, b) => (a.display || '').localeCompare(b.display || ''))

      log('cleaner options (mapped):', mapped)
      setCleanersList(mapped)
    } catch (e: any) {
      err('Error fetching cleaners via affiliations:', e, e?.errors)
    } finally {
      setFetchingCleaners(false)
    }
  }

  // ------------------------------
  // Mutations
  // ------------------------------
  const handleUpdate = async () => {
    const trimmedName = name.trim()
    const validSleeps =
      typeof sleeps === 'number' ? sleeps : Number.parseInt(String(sleeps), 10)
    const validPrice =
      typeof price === 'number' ? price : Number.parseFloat(String(price))

    if (!unitId || !trimmedName || Number.isNaN(validSleeps)) {
      warn('handleUpdate() invalid input', { unitId, trimmedName, validSleeps })
      return
    }

    try {
      const res = await gql.graphql({
        query: updateUnit,
        variables: {
          input: {
            id: unitId,
            name: trimmedName,
            sleeps: validSleeps,
            price: Number.isNaN(validPrice) ? null : validPrice,
          },
        },
      })
      log('updateUnit response:', res)
      alert('✅ Unit updated.')
      fetchUnit()
    } catch (e) {
      err('Error updating unit:', e)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this unit?')) return
    try {
      const res = await gql.graphql({
        query: deleteUnit,
        variables: { input: { id: unitId } },
      })
      log('deleteUnit response:', res)
      alert('🗑️ Unit deleted.')
      router.push('/properties')
    } catch (e) {
      err('Error deleting unit:', e)
    }
  }

  const handleSubmitCleaning = async () => {
    log('handleSubmitCleaning()', {
      unitId,
      cleaningDate,
      assignedTo,
      cleaningStatus,
      editingCleaning,
    })
    if (!unitId || !cleaningDate.trim()) {
      alert('Please enter a cleaning date.')
      return
    }
    if (!assignedTo) {
      alert('Please select a cleaner.')
      return
    }

    const isoDateTime = new Date(cleaningDate).toISOString()
    const normalizedStatus =
      cleaningStatus.charAt(0).toUpperCase() + cleaningStatus.slice(1).toLowerCase()

    const { userId, username } = await getCurrentUser()
    log('currentUser in submit:', { userId, username })

    const input = editingCleaning
      ? {
          id: editingCleaning.id,
          unitID: unitId,
          date: isoDateTime,
          status: normalizedStatus,
          assignedTo,
          owner: userId,
        }
      : {
          unitID: unitId,
          date: isoDateTime,
          status: normalizedStatus,
          assignedTo,
          owner: userId,
        }

    try {
      const res = await gql.graphql({
        query: editingCleaning ? updateCleaning : createCleaning,
        variables: { input },
      })
      log('save cleaning response:', res)

      setCleaningDate('')
      setAssignedTo('')
      setCleaningStatus('Scheduled')
      setEditingCleaning(null)

      fetchCleaningsForUnit()
    } catch (e: any) {
      err('Error saving cleaning:', e, e?.errors)
      alert(`Error saving cleaning: ${e?.errors?.[0]?.message || e}`)
    }
  }

  const handleDeleteCleaning = async (id: string) => {
    if (!confirm('Delete this cleaning?')) return
    try {
      const res = await gql.graphql({
        query: deleteCleaning,
        variables: { input: { id } },
      })
      log('deleteCleaning response:', res)
      fetchCleaningsForUnit()
    } catch (e) {
      err('Failed to delete cleaning:', e)
    }
  }

  const handleMarkComplete = async (c: Cleaning) => {
    const { userId } = await getCurrentUser()
    log('handleMarkComplete()', { cleaningId: c.id, userId })
    try {
      const res = await gql.graphql({
        query: updateCleaning,
        variables: {
          input: {
            id: c.id,
            unitID: c.unitID,
            date: c.date,
            status: 'Completed',
            assignedTo: c.assignedTo || null,
            owner: userId,
          },
        },
      })
      log('markComplete response:', res)
      fetchCleaningsForUnit()
    } catch (e) {
      err('Failed to mark cleaning complete:', e)
    }
  }

  // ------------------------------
  // Effects
  // ------------------------------
  useEffect(() => {
    ;(async () => {
      log('mount/useEffect unitId=', unitId)
      try {
        const cu = await getCurrentUser()
        log('Cognito user:', cu)
      } catch (e) {
        warn('getCurrentUser failed (not signed in?)', e)
      }
      await Promise.all([fetchUnit(), fetchCleaningsForUnit(), fetchCleaners()])
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId])

  // ------------------------------
  // Render
  // ------------------------------
  if (loading) {
    return (
      <Layout>
        <div className="p-6">Loading unit…</div>
      </Layout>
    )
  }
  if (!unit) {
    return (
      <Layout>
        <div className="p-6 text-red-500">Unit not found.</div>
      </Layout>
    )
  }

  const backHref = `/properties/${unit.propertyID}/dashboard`

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6">
        <Link href={backHref} className="text-blue-600 hover:underline mb-4 block">
          ← Back to property
        </Link>
        <h1 className="text-3xl font-bold mb-6">Edit Unit</h1>

        {/* Unit form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded w-full px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Sleeps</label>
            <input
              type="number"
              value={sleeps}
              onChange={(e) => {
                const v = e.target.value
                setSleeps(v === '' ? '' : Number(v))
              }}
              className="border rounded w-24 px-3 py-2"
              min={1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Nightly Price ($)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => {
                const v = e.target.value
                setPrice(v === '' ? '' : Number(v))
              }}
              className="border rounded w-32 px-3 py-2"
              min={0}
            />
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={handleUpdate}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
            <button onClick={handleDelete} className="text-red-600 underline">
              Delete Unit
            </button>
          </div>
        </div>

        <hr className="my-8" />

        {/* Cleaning tasks */}
        <h2 className="text-xl font-semibold mb-4">Cleaning Tasks for This Unit</h2>
        {cleanings.length === 0 ? (
          <p className="text-gray-500 mb-4">No cleanings found for this unit.</p>
        ) : (
          <ul className="space-y-3 mb-6">
            {cleanings.map((c) => (
              <li key={c.id} className="border p-4 rounded shadow-sm">
                <p>
                  <strong>Date:</strong> {new Date(c.date).toLocaleString()}
                </p>
                <p>
                  <strong>Status:</strong> {c.status}
                </p>
                <p>
                  <strong>Assigned To:</strong> {c.assignedTo || 'Unassigned'}
                </p>
                <div className="flex gap-4 mt-2">
                  {c.status === 'Scheduled' && (
                    <button
                      onClick={() => handleMarkComplete(c)}
                      className="text-green-600 underline"
                    >
                      Mark Complete
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setCleaningDate(c.date.split('T')[0])
                      setAssignedTo(c.assignedTo || '')
                      setCleaningStatus(c.status as any)
                      setEditingCleaning(c)
                    }}
                    className="text-blue-600 underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCleaning(c.id)}
                    className="text-red-600 underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Add/Update cleaning form */}
        <div className="border p-4 rounded">
          <h3 className="text-lg font-medium mb-2">
            {editingCleaning ? 'Update Cleaning' : 'Schedule New Cleaning'}
          </h3>

          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="date"
              value={cleaningDate}
              onChange={(e) => setCleaningDate(e.target.value)}
              className="border rounded px-3 py-2"
            />

            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="border rounded px-3 py-2"
              disabled={fetchingCleaners}
            >
              <option value="" disabled>
                {fetchingCleaners ? 'Loading cleaners…' : 'Select Cleaner'}
              </option>
              {cleanersList.map((p) => (
                <option key={p.id} value={p.username}>
                  {p.display || p.username}
                </option>
              ))}
            </select>

            <select
              value={cleaningStatus}
              onChange={(e) => setCleaningStatus(e.target.value as any)}
              className="border rounded px-3 py-2"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Missed">Missed</option>
            </select>

            <button
              onClick={handleSubmitCleaning}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {editingCleaning ? 'Update Cleaning' : 'Add Cleaning'}
            </button>

            {editingCleaning && (
              <button
                onClick={() => {
                  setEditingCleaning(null)
                  setCleaningDate('')
                  setAssignedTo('')
                  setCleaningStatus('Scheduled')
                }}
                className="text-gray-600 underline"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Debug drawer */}
          <div className="mt-4 text-xs text-gray-600 space-y-1">
            <div>unitId: {unitId}</div>
            <div>cleanersList count: {cleanersList.length}</div>
            <div>
              tip: if empty, ensure <code>CleanerAffiliation</code> has an item for your{' '}
              <code>owner</code> (Cognito sub) + <code>cleanerUsername</code>. This page
              calls <code>listAffiliationsByOwner</code> with{' '}
              <code>{`{ owner: ownerSub }`}</code> and falls back to filtered lists using
              <code>owner</code> or <code>ownerSub</code>.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default withRole(['admin', 'owner'], '/cleanings')(UnitDetailPage)

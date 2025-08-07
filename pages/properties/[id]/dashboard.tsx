import { useRouter } from 'next/router'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { generateClient } from 'aws-amplify/api'

import { useAuthProfile } from '@/src/hooks/useAuthProfile'
import { getProperty }                       from '@/src/graphql/custom/getProperty'
import {
  listCleanings,
  listRevenueRecords,
  listUserProfiles,
} from '@/src/graphql/queries'
import {
  createCleaning,
  updateCleaning,
} from '@/src/graphql/mutations'
import type { Property, Unit }        from '@/src/types/Property'
import type { Cleaning }              from '@/src/types/Cleaning'
import type { RevenueRecord }         from '@/src/types/RevenueRecord'
import type { UserProfile }           from '@/src/types/UserProfile'
import Layout                          from '@/src/components/Layout'

const client = generateClient({ authMode: 'userPool' })

export default function PropertyDashboard() {
  const router = useRouter()
  const { role, loading: authLoading } = useAuthProfile()
  const rawId = router.query.id
  const propertyId =
    typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : ''

  // Data state
  const [property, setProperty] = useState<Property | null>(null)
  const [cleanings, setCleanings] = useState<Cleaning[]>([])
  const [revenueRecords, setRevenueRecords] = useState<RevenueRecord[]>([])
  const [cleanersList, setCleanersList] = useState<UserProfile[]>([])
  const [newCleanings, setNewCleanings] =
    useState<Record<string, { date: string; assignedTo: string }>>({})
  const [loadingData, setLoadingData] = useState<boolean>(true)

  // Fetch property, cleanings, revenue, and cleaners
  const fetchAll = useCallback(async () => {
    if (!propertyId) return
    setLoadingData(true)
    try {
      // 1) Load property + units
      const pRes: any = await client.graphql({
        query: getProperty,
        variables: { id: propertyId },
        authMode: 'userPool',
      })
      const prop: Property = pRes.data.getProperty
      setProperty(prop)

      const unitIds = prop.units.items.map((u) => u.id)

      // 2) Load & filter cleanings
      const cRes: any = await client.graphql({
        query: listCleanings,
        authMode: 'userPool',
      })
      setCleanings(
        (cRes.data.listCleanings.items as Cleaning[]).filter((c) =>
          unitIds.includes(c.unitID)
        )
      )

      // 3) Load & filter this month's revenue
      const month = new Date().toISOString().slice(0, 7)
      const rRes: any = await client.graphql({
        query: listRevenueRecords,
        authMode: 'userPool',
      })
      setRevenueRecords(
        (rRes.data.listRevenueRecords.items as RevenueRecord[]).filter(
          (r) => unitIds.includes(r.unitID) && r.month === month
        )
      )

      // 4) Load list of cleaners for assignment dropdown
      const uRes: any = await client.graphql({
        query: listUserProfiles,
        variables: { filter: { role: { eq: 'cleaner' } } },
        authMode: 'userPool',
      })
      setCleanersList(uRes.data.listUserProfiles.items || [])
    } catch (err: any) {
      console.error('❌ fetchAll error:', err.errors ?? err)
    } finally {
      setLoadingData(false)
    }
  }, [propertyId])

  // Redirect non-admin/owner
  useEffect(() => {
    if (!authLoading && !['admin', 'owner'].includes(role || '')) {
      router.replace('/properties')
    }
  }, [authLoading, role, router])

  // Trigger initial load
  useEffect(() => {
    if (router.isReady) fetchAll()
  }, [router.isReady, fetchAll])

  // Early return: loading auth
  if (authLoading) {
    return (
      <Layout>
        <div className="p-6">Checking permissions…</div>
      </Layout>
    )
  }

  // Early return: loading data
  if (loadingData) {
    return (
      <Layout>
        <div className="p-6">Loading dashboard…</div>
      </Layout>
    )
  }

  // If no property
  if (!property) {
    return (
      <Layout>
        <div className="p-6 text-red-500">Property not found.</div>
      </Layout>
    )
  }

  // Helpers
  const getCleaningsForUnit = (unitId: string) =>
    cleanings.filter((c) => c.unitID === unitId)

  const getLastCleanedDate = (unitId: string): string | null => {
    const done = cleanings
      .filter((c) => c.unitID === unitId && c.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return done.length > 0 ? done[0].date : null
  }

  const totalProjected = (property.units.items || []).reduce(
    (sum, u) => sum + (u.price || 0) * 30,
    0
  )
  const totalActual = revenueRecords.reduce(
    (sum, r) => sum + (r.amount || 0),
    0
  )

  // Create cleaning
  const handleCreateCleaning = async (unitId: string) => {
    const entry = newCleanings[unitId]
    if (!entry?.date) {
      alert('Please select a date.')
      return
    }
    if (!entry.assignedTo) {
      alert('Please select a cleaner.')
      return
    }
    try {
      await client.graphql({
        query: createCleaning,
        variables: {
          input: {
            unitID: unitId,
            date: entry.date,
            status: 'scheduled',
            assignedTo: entry.assignedTo,
          },
        },
        authMode: 'userPool',
      })
      setNewCleanings((prev) => ({
        ...prev,
        [unitId]: { date: '', assignedTo: '' },
      }))
      fetchAll()
    } catch (err: any) {
      console.error('❌ createCleaning error:', err.errors ?? err)
      alert('Error creating cleaning')
    }
  }

  // Mark complete
  const handleMarkComplete = async (cleaningId: string) => {
    try {
      await client.graphql({
        query: updateCleaning,
        variables: { input: { id: cleaningId, status: 'completed' } },
        authMode: 'userPool',
      })
      fetchAll()
    } catch (err) {
      console.error('❌ updateCleaning error:', err)
      alert('Error marking complete')
    }
  }

  // Render
  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">
          {property.name} — Owner Dashboard
        </h1>
        <p><strong>Address:</strong> {property.address}</p>
        <p className="font-semibold">
          Projected Monthly Revenue: ${totalProjected.toLocaleString()}
        </p>
        <p className="font-semibold">
          Actual Monthly Revenue:    ${totalActual.toLocaleString()}
        </p>

        {property.units.items.length === 0 ? (
          <p className="text-gray-500">No units found.</p>
        ) : (
          property.units.items.map((unit: Unit) => {
            const lastCleaned = getLastCleanedDate(unit.id)
            const price = unit.price || 0
            const projected = price * 30
            const upcoming = getCleaningsForUnit(unit.id)

            return (
              <div
                key={unit.id}
                className="border rounded p-4 bg-white shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{unit.name}</h2>
                    <p className="text-sm text-gray-500">
                      {lastCleaned
                        ? `Last cleaned: ${new Date(
                            lastCleaned
                          ).toLocaleDateString()}`
                        : 'Not yet cleaned'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Price: ${price.toFixed(2)} / night
                    </p>
                    <p className="text-sm text-gray-500">
                      Projected: ${projected.toLocaleString()}
                    </p>
                  </div>
                  <Link
                    href={`/units/${unit.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Edit Unit →
                  </Link>
                </div>

                <p><strong>Sleeps:</strong> {unit.sleeps}</p>

                <div>
                  <h3 className="font-medium mb-2">Upcoming Cleanings:</h3>
                  {upcoming.length === 0 ? (
                    <p className="text-gray-500">No cleanings scheduled.</p>
                  ) : (
                    <ul className="space-y-1">
                      {upcoming.map((c) => (
                        <li
                          key={c.id}
                          className="flex justify-between items-center border-b py-2"
                        >
                          <div>
                            <strong>{new Date(c.date).toLocaleDateString()}</strong> — {c.status}
                            <span className="text-gray-500 ml-2">
                              Assigned: {c.assignedTo}
                            </span>
                          </div>
                          {c.status === 'scheduled' && (
                            <button
                              onClick={() => handleMarkComplete(c.id)}
                              className="text-green-600 hover:underline text-sm"
                            >
                              Mark Complete
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Add Cleaning</h4>
                  <div className="flex flex-wrap gap-3">
                    <input
                      type="date"
                      value={newCleanings[unit.id]?.date || ''}
                      onChange={(e) =>
                        setNewCleanings((prev) => ({
                          ...prev,
                          [unit.id]: {
                            ...prev[unit.id],
                            date: e.target.value,
                          },
                        }))
                      }
                      className="border rounded px-3 py-1"
                    />
                    <select
                      value={newCleanings[unit.id]?.assignedTo || ''}
                      onChange={(e) =>
                        setNewCleanings((prev) => ({
                          ...prev,
                          [unit.id]: {
                            ...prev[unit.id],
                            assignedTo: e.target.value,
                          },
                        }))
                      }
                      className="border rounded px-3 py-1"
                    >
                      <option value="" disabled>
                        Select Cleaner
                      </option>
                      {cleanersList.map((c) => (
                        <option key={c.id} value={c.username}>
                          {c.username}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleCreateCleaning(unit.id)}
                      className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                    >
                      Add Cleaning
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </Layout>
  )
}
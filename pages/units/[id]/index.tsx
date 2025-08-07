import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'

import { getCurrentUser } from 'aws-amplify/auth'
import { getUnit, listCleanings, listUserProfiles } from '@/src/graphql/queries'
import {
  updateUnit,
  deleteUnit,
  createCleaning,
  updateCleaning,
  deleteCleaning,
} from '@/src/graphql/mutations'

import Layout from '@/src/components/Layout'
import { withRole } from '@/src/components/withRole'
import type { Cleaning } from '@/src/types/Cleaning'
import type { Unit as UnitType } from '@/src/types/Property'
import type { UserProfile } from '@/src/types/UserProfile'

// GraphQL client with userPool auth
const client = generateClient({ authMode: 'userPool' })

function UnitDetailPage() {
  const router = useRouter()
  const rawId = router.query.id
  const unitId =
    typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : ''

  // Unit state
  const [unit, setUnit] = useState<UnitType | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [name, setName] = useState('')
  const [sleeps, setSleeps] = useState<number | ''>('')
  const [price, setPrice] = useState<number | ''>('')

  // Cleanings state
  const [cleanings, setCleanings] = useState<Cleaning[]>([])
  const [cleaningDate, setCleaningDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [cleaningStatus, setCleaningStatus] =
    useState<'Scheduled' | 'Completed' | 'Missed'>('Scheduled')
  const [editingCleaning, setEditingCleaning] = useState<Cleaning | null>(null)

  // List of cleaners for dropdown
  const [cleanersList, setCleanersList] = useState<UserProfile[]>([])

  // Fetch unit details
  const fetchUnit = async () => {
    if (!unitId) return
    try {
      const res: any = await client.graphql({
        query: getUnit,
        variables: { id: unitId },
        authMode: 'userPool',
      })
      const u = res.data.getUnit
      setUnit(u)
      setName(u.name)
      setSleeps(u.sleeps)
      setPrice(u.price ?? '')
    } catch (err) {
      console.error('Error fetching unit:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch all cleanings for this unit
  const fetchCleaningsForUnit = async () => {
    if (!unitId) return
    try {
      const res: any = await client.graphql({
        query: listCleanings,
        variables: { filter: { unitID: { eq: unitId } } },
        authMode: 'userPool',
      })
      setCleanings(res.data.listCleanings.items)
    } catch (err) {
      console.error('Error fetching cleanings:', err)
    }
  }

  // Fetch cleaners for assignment
  const fetchCleaners = async () => {
    try {
      const res: any = await client.graphql({
        query: listUserProfiles,
        variables: { filter: { role: { eq: 'cleaner' } } },
        authMode: 'userPool',
      })
      setCleanersList(res.data.listUserProfiles.items)
    } catch (err) {
      console.error('Error fetching cleaners list:', err)
    }
  }

  // Update unit
  const handleUpdate = async () => {
    const trimmedName = name.trim()
    const validSleeps = typeof sleeps === 'number' ? sleeps : parseInt(sleeps as any, 10)
    const validPrice = typeof price === 'number' ? price : parseFloat(price as any)
    if (!unitId || !trimmedName || !validSleeps) return
    try {
      await client.graphql({
        query: updateUnit,
        variables: {
          input: {
            id: unitId,
            name: trimmedName,
            sleeps: validSleeps,
            price: isNaN(validPrice) ? null : validPrice,
          },
        },
        authMode: 'userPool',
      })
      alert('✅ Unit updated.')
      fetchUnit()
    } catch (err) {
      console.error('Error updating unit:', err)
    }
  }

  // Delete unit
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this unit?')) return
    try {
      await client.graphql({
        query: deleteUnit,
        variables: { input: { id: unitId } },
        authMode: 'userPool',
      })
      alert('🗑️ Unit deleted.')
      router.push('/properties')
    } catch (err) {
      console.error('Error deleting unit:', err)
    }
  }

  // Create or update cleaning
  const handleSubmitCleaning = async () => {
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
      cleaningStatus.charAt(0).toUpperCase() +
      cleaningStatus.slice(1).toLowerCase()
    const { userId } = await getCurrentUser()
    const input = editingCleaning
      ? { id: editingCleaning.id, unitID: unitId, date: isoDateTime, status: normalizedStatus, assignedTo, owner: userId }
      : { unitID: unitId, date: isoDateTime, status: normalizedStatus, assignedTo, owner: userId }
    try {
      await client.graphql({
        query: editingCleaning ? updateCleaning : createCleaning,
        variables: { input },
        authMode: 'userPool',
      })
      setCleaningDate('')
      setAssignedTo('')
      setCleaningStatus('Scheduled')
      setEditingCleaning(null)
      fetchCleaningsForUnit()
    } catch (err: any) {
      console.error('Error saving cleaning:', err)
      alert(`Error saving cleaning: ${err?.errors?.[0]?.message || err}`)
    }
  }

  // Delete cleaning
  const handleDeleteCleaning = async (id: string) => {
    if (!confirm('Delete this cleaning?')) return
    try {
      await client.graphql({
        query: deleteCleaning,
        variables: { input: { id } },
        authMode: 'userPool',
      })
      fetchCleaningsForUnit()
    } catch (err) {
      console.error('Failed to delete cleaning:', err)
    }
  }

  // Mark cleaning complete
  const handleMarkComplete = async (c: Cleaning) => {
    const { userId } = await getCurrentUser()
    try {
      await client.graphql({
        query: updateCleaning,
        variables: { input: { id: c.id, unitID: c.unitID, date: c.date, status: 'Completed', assignedTo: c.assignedTo || null, owner: userId } },
        authMode: 'userPool',
      })
      fetchCleaningsForUnit()
    } catch (err) {
      console.error('Failed to mark cleaning complete:', err)
    }
  }

  useEffect(() => {
    fetchUnit()
    fetchCleaningsForUnit()
    fetchCleaners()
  }, [unitId])

  if (loading) return <Layout><div className="p-6">Loading unit…</div></Layout>
  if (!unit) return <Layout><div className="p-6 text-red-500">Unit not found.</div></Layout>

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6">
        <Link href={`/properties/${unit.propertyID}/dashboard`} className="text-blue-600 hover:underline mb-4 block">← Back to property</Link>
        <h1 className="text-3xl font-bold mb-6">Edit Unit</h1>

        {/* Unit form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="border rounded w-full px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Sleeps</label>
            <input type="number" value={sleeps} onChange={e => setSleeps(Number(e.target.value))} className="border rounded w-24 px-3 py-2" min={1} />
          </div>
          <div>
            <label className="block text-sm font-medium">Nightly Price ($)</label>
            <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="border rounded w-32 px-3 py-2" min={0} />
          </div>
          <div className="flex gap-4 mt-4">
            <button onClick={handleUpdate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save Changes</button>
            <button onClick={handleDelete} className="text-red-600 underline">Delete Unit</button>
          </div>
        </div>

        <hr className="my-8" />

        {/* Cleaning tasks */}
        <h2 className="text-xl font-semibold mb-4">Cleaning Tasks for This Unit</h2>
        {cleanings.length === 0 ? (
          <p className="text-gray-500 mb-4">No cleanings found for this unit.</p>
        ) : (
          <ul className="space-y-3 mb-6">
            {cleanings.map(c => (
              <li key={c.id} className="border p-4 rounded shadow-sm">
                <p><strong>Date:</strong> {new Date(c.date).toLocaleString()}</p>
                <p><strong>Status:</strong> {c.status}</p>
                <p><strong>Assigned To:</strong> {c.assignedTo || 'Unassigned'}</p>
                <div className="flex gap-4 mt-2">
                  {c.status === 'Scheduled' && (<button onClick={() => handleMarkComplete(c)} className="text-green-600 underline">Mark Complete</button>)}
                  <button onClick={() => { setCleaningDate(c.date.split('T')[0]); setAssignedTo(c.assignedTo || ''); setCleaningStatus(c.status as any); setEditingCleaning(c); }} className="text-blue-600 underline">Edit</button>
                  <button onClick={() => handleDeleteCleaning(c.id)} className="text-red-600 underline">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Add/Update cleaning form */}
        <div className="border p-4 rounded">
          <h3 className="text-lg font-medium mb-2">{editingCleaning ? 'Update Cleaning' : 'Schedule New Cleaning'}</h3>
          <div className="flex flex-wrap gap-4">
            <input type="date" value={cleaningDate} onChange={e => setCleaningDate(e.target.value)} className="border rounded px-3 py-2" />
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="border rounded px-3 py-2">
              <option value="" disabled>Select Cleaner</option>
              {cleanersList.map(c => (<option key={c.id} value={c.username}>{c.username}</option>))}
            </select>
            <select value={cleaningStatus} onChange={e => setCleaningStatus(e.target.value as any)} className="border rounded px-3 py-2">
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Missed">Missed</option>
            </select>
            <button onClick={handleSubmitCleaning} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">{editingCleaning ? 'Update Cleaning' : 'Add Cleaning'}</button>
            {editingCleaning && (<button onClick={() => { setEditingCleaning(null); setCleaningDate(''); setAssignedTo(''); setCleaningStatus('Scheduled'); }} className="text-gray-600 underline">Cancel</button>)}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default withRole(['admin','owner'], '/cleanings')(UnitDetailPage)

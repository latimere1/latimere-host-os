
//pages/cleanings/index.tsx

import { useEffect, useState, useCallback } from 'react'
import { generateClient } from 'aws-amplify/api'
import { withRole } from '@/src/components/withRole'
import { useAuthProfile } from '@/hooks/useAuthProfile'
import { listCleanings } from '@/graphql/queries'
import { updateCleaning } from '@/graphql/mutations'
import type { Cleaning } from '@/types/Cleaning'
import Layout from '@/src/components/Layout'

// GraphQL client configured for User Pool auth
const client = generateClient({ authMode: 'userPool' })

function CleaningListPage() {
  const { role, loading: authLoading, username } = useAuthProfile()
  const [cleanings, setCleanings] = useState<Cleaning[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Fetch assigned tasks
  const fetchCleanings = useCallback(async () => {
    if (!username) return
    setLoading(true)
    try {
      const resp: any = await client.graphql({
        query:    listCleanings,
        variables:{ filter: { assignedTo: { eq: username } } },
        authMode: 'userPool',
      })
      setCleanings(resp.data.listCleanings.items)
    } catch (err) {
      console.error('❌ Error fetching cleanings:', err)
    } finally {
      setLoading(false)
    }
  }, [username])

  // Initial fetch after auth
  useEffect(() => {
    if (!authLoading) fetchCleanings()
  }, [authLoading, fetchCleanings])

  // Handler to mark a cleaning complete
  const markComplete = async (id: string) => {
    try {
      await client.graphql({
        query:    updateCleaning,
        variables:{ input: { id, status: 'completed' } },
        authMode: 'userPool',
      })
      fetchCleanings()
    } catch (err) {
      console.error('❌ Error marking cleaning complete:', err)
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Layout>
        <div className="p-6">Checking permissions…</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">My Cleaning Tasks</h1>

        {/* Task list */}
        {loading ? (
          <p>Loading cleanings…</p>
        ) : cleanings.length === 0 ? (
          <p>No cleaning tasks assigned to you.</p>
        ) : (
          <ul className="space-y-3">
            {cleanings.map((c) => (
              <li
                key={c.id}
                className="border p-4 rounded shadow-sm flex justify-between items-center"
              >
                <div>
                  <p><strong>Unit ID:</strong> {c.unitID}</p>
                  <p><strong>Date:</strong> {new Date(c.date).toLocaleString()}</p>
                  <p><strong>Status:</strong> {c.status}</p>
                </div>
                {c.status !== 'completed' && (
                  <button
                    onClick={() => markComplete(c.id)}
                    className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                  >
                    Mark Complete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  )
}

// Only 'cleaner' role may view; others get redirected
export default withRole(['cleaner'], '/properties')(CleaningListPage)
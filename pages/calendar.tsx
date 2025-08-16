// pages/calendar.tsx
// ────────────────────────────────────────────────────────────────────────────
// Global cleaning-calendar view.
// • Fetches ALL Cleaning records
// • Lets user filter by cleaner or status
// • Works for any signed-in role (no RBAC wrapper needed)
// • Fix: ensure each item conforms to Cleaning type (must include `date`)
// ────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'

import { listCleanings } from '@/graphql/queries'
import Layout from '@/src/components/Layout'
import CleaningCalendar from '@/src/components/CleaningCalendar'
import type { Cleaning } from '@/types/Cleaning'

const client = generateClient({ authMode: 'userPool' })

/** Normalize various date-ish inputs to YYYY-MM-DD for calendar use */
function toYMD(input?: string | null): string | null {
  if (!input) return null
  // Accept raw YYYY-MM-DD, or full ISO like 2025-08-10T12:34:56Z
  const d = input.includes('T') ? input.split('T')[0] : input
  // Super basic guard: YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null
}

export default function CalendarPage() {
  const [cleanings, setCleanings] = useState<Cleaning[]>([])
  const [filtered, setFiltered] = useState<Cleaning[]>([])
  const [loading, setLoading] = useState(true)
  const [cleanerFilter, setCleanerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<Cleaning['status'] | ''>('')

  // ── Fetch all cleanings ──────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      console.log('[Calendar] fetching cleanings…')
      try {
        const res: any = await client.graphql({ query: listCleanings })
        const items: any[] = res?.data?.listCleanings?.items ?? []
        console.log(`[Calendar] got ${items.length} raw items`)

        const normalised: Cleaning[] = items
          .filter((c) => {
            const hasKeys = c && c.id && c.unitID
            const possibleDate = toYMD(c?.scheduledDate) ?? toYMD(c?.date)
            if (!(hasKeys && possibleDate)) {
              console.warn('[Calendar] dropping item (missing keys/date)', {
                id: c?.id,
                unitID: c?.unitID,
                scheduledDate: c?.scheduledDate,
                date: c?.date,
              })
            }
            return hasKeys && !!possibleDate
          })
          .map((c) => {
            const ymd = toYMD(c?.scheduledDate) ?? toYMD(c?.date)!
            const status = (c?.status ?? 'scheduled').toLowerCase() as Cleaning['status']
            const obj: Cleaning = {
              id: String(c.id),
              unitID: String(c.unitID),
              // ✅ REQUIRED by type:
              date: ymd,
              // Optional/extra fields your calendar or UI may use:
              scheduledDate: ymd,
              status,
              assignedTo: c?.assignedTo ?? '',
              unitName: c?.unit?.name ?? 'Unknown',
            }
            return obj
          })

        console.log(`[Calendar] normalized -> ${normalised.length} items`)
        setCleanings(normalised)
        setFiltered(normalised)
      } catch (err) {
        console.error('❌ [Calendar] listCleanings error:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // ── Apply in-memory filters whenever inputs change ───────────────────────
  useEffect(() => {
    let list = cleanings

    if (cleanerFilter.trim()) {
      const term = cleanerFilter.toLowerCase()
      list = list.filter((c) => (c.assignedTo ?? '').toLowerCase().includes(term))
    }
    if (statusFilter) {
      list = list.filter((c) => c.status === statusFilter)
    }
    setFiltered(list)
  }, [cleanerFilter, statusFilter, cleanings])

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Layout title="Cleaning Calendar">
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="mb-4 text-3xl font-bold">Cleaning Calendar</h1>

        <div className="mb-6 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Filter by cleaner e‑mail"
            value={cleanerFilter}
            onChange={(e) => setCleanerFilter(e.target.value)}
            className="rounded border border-gray-300 bg-[#1E1E1E] px-3 py-2 text-white"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Cleaning['status'] | '')}
            className="rounded border border-gray-300 bg-[#1E1E1E] px-3 py-2 text-white"
          >
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="missed">Missed</option>
          </select>
        </div>

        {loading ? (
          <p>Loading cleanings…</p>
        ) : filtered.length > 0 ? (
          <CleaningCalendar cleanings={filtered} />
        ) : (
          <p className="text-gray-500">No cleanings match the current filters.</p>
        )}
      </div>
    </Layout>
  )
}

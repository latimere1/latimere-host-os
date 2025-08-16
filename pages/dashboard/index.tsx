// pages/dashboard/index.tsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import Layout from '@/src/components/Layout'
import { withRole } from '@/src/components/withRole'
import { generateClient } from 'aws-amplify/api'
import { getCurrentUser } from 'aws-amplify/auth'

// GraphQL queries (adjust import path/names if your codegen differs)
import {
  listProperties,
  listBookings,
  listCleanings,
  listRevenueRecords,
} from '@/src/graphql/queries'

const client = generateClient({ authMode: 'userPool' })

// ───────────────────────────────────────────────────────────
// Helpers
const iso = (d: Date) => d.toISOString()
const startOfWeek = (d = new Date()) => {
  const x = new Date(d)
  const day = x.getDay() // 0..6
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - day)
  return x
}
const endOfWeek = (d = new Date()) => {
  const s = startOfWeek(d)
  const e = new Date(s)
  e.setDate(s.getDate() + 6)
  e.setHours(23, 59, 59, 999)
  return e
}
const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'
const money = (n = 0) =>
  (n || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

// Small TS interfaces aligned with your schema (loose where not critical)
type Property = { id: string; name: string; address?: string | null }
type Booking = { id: string; unitID: string; checkIn: string; checkOut: string; guestName?: string | null }
type Cleaning = { id: string; unitID: string; date: string; status: string; assignedTo?: string | null }
type RevenueRecord = { id: string; unitID: string; amount: number; month: string }

function KPI({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-400">{sub}</div>}
    </div>
  )
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Table({
  columns,
  rows,
  empty = 'Nothing to show.',
}: {
  columns: string[]
  rows: React.ReactNode[][]
  empty?: string
}) {
  if (!rows.length) {
    return <div className="text-sm text-gray-500">{empty}</div>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            {columns.map((h) => (
              <th key={h} className="p-2 font-medium text-gray-600">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {r.map((cell, j) => (
                <td key={j} className="p-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [ownerSub, setOwnerSub] = useState<string | null>(null)

  const [properties, setProperties] = useState<Property[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [cleanings, setCleanings] = useState<Cleaning[]>([])
  const [revenue, setRevenue] = useState<RevenueRecord[]>([])

  // ───────────────────────────────────────────────────────────
  // Init current user
  useEffect(() => {
    ;(async () => {
      try {
        const u = await getCurrentUser()
        console.log('👤 getCurrentUser():', u)
        setOwnerSub(u?.userId ?? null)
      } catch (err) {
        console.error('❌ getCurrentUser failed:', err)
      }
    })()
  }, [])

  // ───────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!ownerSub) return
    setLoading(true)

    const now = new Date()
    const last30 = addDays(now, -30)
    const sWeek = startOfWeek(now)
    const eWeek = endOfWeek(now)
    const next7 = addDays(now, 7)

    console.log('📊 Loading GLOBAL dashboard', {
      ownerSub,
      last30: iso(last30),
      sWeek: iso(sWeek),
      eWeek: iso(eWeek),
      next7: iso(next7),
    })

    try {
      const [propsRes, bookingsRes, cleaningsRes, revRes] = await Promise.all([
        client.graphql({
          query: listProperties,
          variables: { filter: { owner: { eq: ownerSub } }, limit: 200 },
          authMode: 'userPool',
        }),
        client.graphql({
          query: listBookings,
          variables: {
            filter: {
              owner: { eq: ownerSub },
              // pull last 30d + upcoming (leaves some buffer to compute occupancy windows client-side)
              checkIn: { ge: iso(last30) },
            },
            limit: 400,
          },
          authMode: 'userPool',
        }),
        client.graphql({
          query: listCleanings,
          variables: {
            filter: {
              owner: { eq: ownerSub },
              date: { between: [iso(sWeek), iso(eWeek)] },
            },
            limit: 400,
          },
          authMode: 'userPool',
        }),
        client.graphql({
          query: listRevenueRecords,
          variables: {
            filter: { owner: { eq: ownerSub } },
            limit: 500,
          },
          authMode: 'userPool',
        }),
      ])

      const props = propsRes?.data?.listProperties?.items ?? []
      const bks = bookingsRes?.data?.listBookings?.items ?? []
      const cls = cleaningsRes?.data?.listCleanings?.items ?? []
      const rev = revRes?.data?.listRevenueRecords?.items ?? []

      console.log('✅ properties:', props.length)
      console.log('✅ bookings:', bks.length)
      console.log('✅ cleanings(this week):', cls.length)
      console.log('✅ revenue rows:', rev.length)

      setProperties(props.filter(Boolean))
      setBookings(bks.filter(Boolean))
      setCleanings(cls.filter(Boolean))
      setRevenue(rev.filter(Boolean))
    } catch (err) {
      console.error('❌ Dashboard load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [ownerSub])

  useEffect(() => {
    load()
  }, [load])

  // ───────────────────────────────────────────────────────────
  // Derived metrics
  const { upcomingCount, cleaningsCount, payout30d } = useMemo(() => {
    const now = new Date()
    const upcoming = bookings.filter((b) => new Date(b.checkIn) >= now && new Date(b.checkIn) <= addDays(now, 7))
    const payout = revenue.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    return {
      upcomingCount: upcoming.length,
      cleaningsCount: cleanings.length,
      payout30d: payout,
    }
  }, [bookings, cleanings, revenue])

  const upcomingRows = useMemo<React.ReactNode[][]>(() => {
    const now = new Date()
    const soon = addDays(now, 7)
    return bookings
      .filter((b) => {
        const d = new Date(b.checkIn)
        return d >= now && d <= soon
      })
      .sort((a, b) => +new Date(a.checkIn) - +new Date(b.checkIn))
      .slice(0, 20)
      .map((b) => [
        <span key="date">{fmtDate(b.checkIn)}</span>,
        <span key="guest">{b.guestName || '—'}</span>,
        <span key="unit">{b.unitID}</span>,
      ])
  }, [bookings])

  const cleaningRows = useMemo<React.ReactNode[][]>(() => {
    return cleanings
      .slice() // copy
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))
      .slice(0, 20)
      .map((c) => [
        <span key="date">{fmtDate(c.date)}</span>,
        <span key="status" className="inline-flex items-center gap-2">
          <span
            className={
              'inline-block h-2 w-2 rounded-full ' +
              (c.status === 'Completed'
                ? 'bg-green-500'
                : c.status === 'Scheduled'
                ? 'bg-amber-500'
                : 'bg-gray-400')
            }
          />
          {c.status}
        </span>,
        <span key="who">{c.assignedTo || '—'}</span>,
        <span key="unit">{c.unitID}</span>,
      ])
  }, [cleanings])

  // ───────────────────────────────────────────────────────────
  // UI
  return (
    <Layout title="Dashboard">
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPI label="Upcoming check‑ins (7d)" value={upcomingCount} sub="Across all properties" />
            <KPI label="Cleanings this week" value={cleaningsCount} sub="Scheduled or completed" />
            <KPI label="Payout (last 30d)" value={money(payout30d)} />
          </div>

          {/* Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section
              title="Next 7 days — Bookings"
              action={
                <a href="/properties" className="text-xs underline">
                  View properties →
                </a>
              }
            >
              <Table columns={['Check‑in', 'Guest', 'Unit']} rows={upcomingRows} empty="No upcoming bookings." />
            </Section>

            <Section
              title="This week — Cleanings"
              action={
                <a href="/cleanings" className="text-xs underline">
                  View all cleanings →
                </a>
              }
            >
              <Table columns={['Date', 'Status', 'Cleaner', 'Unit']} rows={cleaningRows} empty="No cleanings this week." />
            </Section>
          </div>

          {/* Properties grid */}
          <Section title="Your Properties">
            {properties.length === 0 ? (
              <div className="text-sm text-gray-500">No properties yet.</div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {properties.map((p) => (
                  <li key={p.id} className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="font-medium">{p.name}</div>
                    {p.address && <div className="text-sm text-gray-500">{p.address}</div>}
                    <div className="mt-3 flex gap-2">
                      <a
                        className="text-sm underline"
                        href={`/properties/${p.id}/dashboard`}
                        onClick={() => console.log('➡️ open property dashboard', p.id)}
                      >
                        Open dashboard →
                      </a>
                      <a
                        className="text-sm underline"
                        href={`/properties/${p.id}`}
                        onClick={() => console.log('➡️ open property', p.id)}
                      >
                        Open property →
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}
    </Layout>
  )
}

export default withRole(['owner', 'admin'])(DashboardPage)

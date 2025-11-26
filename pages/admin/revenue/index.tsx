/* pages/admin/revenue/index.tsx */
/* eslint-disable no-console */
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { generateClient, GRAPHQL_AUTH_MODE } from 'aws-amplify/api'

const client = generateClient()

// Optional client-side debug flag
const debugRevenueClient =
  typeof window !== 'undefined' &&
  (process.env.NEXT_PUBLIC_DEBUG_REVENUE === '1' ||
    process.env.NEXT_PUBLIC_DEBUG_REFERRALS === '1')

// ---- GraphQL ----

const LIST_PROPERTIES_WITH_REVENUE = /* GraphQL */ `
  query ListPropertiesWithRevenue($limit: Int, $nextToken: String) {
    listProperties(limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        nickname
        city
        state
        country
        revenueProfile {
          id
          tier
          pricingCadence
          isActive
          internalLabel
        }
        revenueSnapshots(limit: 1, sortDirection: DESC) {
          items {
            id
            periodStart
            periodEnd
            label
            grossRevenue
            occupancyPct
            adr
          }
        }
      }
      nextToken
    }
  }
`

// ---- Types (local, minimal) ----

type RevenueTier = 'ESSENTIAL' | 'PRO' | 'ELITE'
type PricingCadence = 'WEEKLY' | 'DAILY'

type RevenueProfile = {
  id: string
  tier: RevenueTier
  pricingCadence: PricingCadence
  isActive: boolean
  internalLabel?: string | null
}

type RevenueSnapshot = {
  id: string
  periodStart: string
  periodEnd: string
  label?: string | null
  grossRevenue?: number | null
  occupancyPct?: number | null
  adr?: number | null
}

type PropertyRow = {
  id: string
  name?: string | null
  nickname?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  revenueProfile?: RevenueProfile | null
  revenueSnapshots?: {
    items?: RevenueSnapshot[]
  } | null
}

type ListPropertiesResponse = {
  listProperties?: {
    items?: PropertyRow[]
    nextToken?: string | null
  } | null
}

function formatCurrency(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '-'
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatPercent(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '-'
  return `${value.toFixed(0)}%`
}

function formatLabel(periodStart?: string, label?: string | null): string {
  if (label) return label
  if (!periodStart) return '—'
  // Simple YYYY-MM to "MMM YYYY"
  const d = new Date(periodStart)
  if (Number.isNaN(d.getTime())) return periodStart
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

function tierDisplay(tier?: RevenueTier | null): string {
  if (!tier) return '—'
  switch (tier) {
    case 'ESSENTIAL':
      return 'Essential'
    case 'PRO':
      return 'Pro'
    case 'ELITE':
      return 'Elite'
    default:
      return tier
  }
}

function cadenceDisplay(cadence?: PricingCadence | null): string {
  if (!cadence) return '—'
  switch (cadence) {
    case 'WEEKLY':
      return 'Weekly'
    case 'DAILY':
      return 'Daily'
    default:
      return cadence
  }
}

export default function AdminRevenueOverviewPage() {
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      setError(null)
      console.log('[AdminRevenue] Fetching properties with revenue data...')

      try {
        const allItems: PropertyRow[] = []
        let nextToken: string | null | undefined = null

        do {
          console.log('[AdminRevenue] Calling listProperties, nextToken =', nextToken)

          const response = await client.graphql({
            query: LIST_PROPERTIES_WITH_REVENUE,
            variables: {
              limit: 50,
              nextToken: nextToken ?? null,
            },
            authMode: GRAPHQL_AUTH_MODE.API_KEY,
          })

          const { data, errors } = response as {
            data?: ListPropertiesResponse
            errors?: unknown
          }

          if (errors) {
            console.error(
              '[AdminRevenue] GraphQL errors from listProperties:',
              errors
            )
            throw new Error('GraphQL error while listing properties')
          }

          const page = data?.listProperties?.items ?? []
          nextToken = data?.listProperties?.nextToken ?? null

          if (debugRevenueClient) {
            console.log(
              '[AdminRevenue] Received page:',
              page.length,
              'items, nextToken =',
              nextToken
            )
          }

          allItems.push(...page.filter(Boolean))
        } while (nextToken)

        if (!isMounted) return

        setProperties(allItems)
        console.log('[AdminRevenue] Total properties loaded:', allItems.length)
      } catch (err) {
        console.error('[AdminRevenue] Error while loading properties:', err)
        if (!isMounted) return
        setError('Failed to load revenue data. Check console logs for details.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <>
      <Head>
        <title>Latimere Revenue Management — Admin Overview</title>
      </Head>
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <header className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-cyan-400">
                Revenue Management — Admin Overview
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                High-level view of each property&apos;s Latimere revenue status and last
                monthly performance.
              </p>
            </div>
          </header>

          {loading && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-200">
              Loading revenue data...
            </div>
          )}

          {error && !loading && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-300">
                      Property
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-300">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-300">
                      Tier
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-300">
                      Cadence
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-300">
                      Last Period
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-slate-300">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-slate-300">
                      Occupancy
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-slate-300">
                      ADR
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                  {properties.map((p) => {
                    const profile = p.revenueProfile ?? undefined
                    const latestSnapshot =
                      p.revenueSnapshots?.items?.[0] ?? undefined

                    return (
                      <tr key={p.id} className="hover:bg-slate-900/60">
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-50">
                              {p.nickname || p.name || 'Untitled Property'}
                            </span>
                            {p.name && p.nickname && (
                              <span className="text-xs text-slate-400">
                                {p.name}
                              </span>
                            )}
                            {profile?.internalLabel && (
                              <span className="mt-0.5 text-xs text-cyan-300">
                                {profile.internalLabel}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-slate-300">
                          {[p.city, p.state, p.country]
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {profile ? (
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                profile.isActive
                                  ? 'bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/40'
                                  : 'bg-slate-800 text-slate-300 ring-1 ring-slate-600/60'
                              }`}
                            >
                              {tierDisplay(profile.tier)}
                              {!profile.isActive && (
                                <span className="ml-1 text-[10px] uppercase tracking-wide text-slate-400">
                                  inactive
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">
                              Not configured
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-slate-300">
                          {profile ? cadenceDisplay(profile.pricingCadence) : '—'}
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-slate-300">
                          {latestSnapshot
                            ? formatLabel(
                                latestSnapshot.periodStart,
                                latestSnapshot.label
                              )
                            : '—'}
                        </td>
                        <td className="px-4 py-3 align-top text-right text-sm text-slate-100">
                          {latestSnapshot
                            ? formatCurrency(latestSnapshot.grossRevenue ?? 0)
                            : '—'}
                        </td>
                        <td className="px-4 py-3.align-top text-right text-sm text-slate-100">
                          {latestSnapshot
                            ? formatPercent(latestSnapshot.occupancyPct ?? 0)
                            : '—'}
                        </td>
                        <td className="px-4 py-3 align-top text-right text-sm text-slate-100">
                          {latestSnapshot
                            ? formatCurrency(latestSnapshot.adr ?? 0)
                            : '—'}
                        </td>
                        <td className="px-4 py-3 align-top text-right text-sm">
                          <Link
                            href={`/properties/${p.id}/revenue`}
                            className="inline-flex items-center rounded-full bg-cyan-500 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-cyan-400"
                          >
                            View details
                          </Link>
                        </td>
                      </tr>
                    )
                  })}

                  {properties.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-8 text-center text-sm text-slate-400"
                      >
                        No properties found yet. Once you&apos;ve added properties and
                        created revenue snapshots, they will appear here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

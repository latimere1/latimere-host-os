/* pages/owner/revenue/[id].tsx */
/* eslint-disable no-console */
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'

const client = generateClient()

// ------------- GraphQL -------------

const GET_OWNER_PROPERTY_REVENUE = /* GraphQL */ `
  query GetOwnerPropertyRevenue($id: ID!, $snapLimit: Int, $snapNextToken: String) {
    getProperty(id: $id) {
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
        baseNightlyRate
        targetOccupancyPct
        marketName
      }

      revenueSnapshots(limit: $snapLimit, sortDirection: DESC, nextToken: $snapNextToken) {
        items {
          id
          periodStart
          periodEnd
          label
          grossRevenue
          occupancyPct
          adr
          nightsBooked
          nightsAvailable
          marketOccupancyPct
          marketAdr
          future30Revenue
          future60Revenue
          future90Revenue
          cleaningFeesCollected
          cancellationsCount
          cancellationRevenueLost
          revenueReportUrl
          dashboardUrl
          keyInsights
          pricingDecisionsSummary
          createdAt
        }
        nextToken
      }
    }
  }
`

// ------------- Types -------------

type RevenueTier = 'ESSENTIAL' | 'PRO' | 'ELITE'
type PricingCadence = 'WEEKLY' | 'DAILY'

type RevenueProfile = {
  id: string
  tier: RevenueTier
  pricingCadence: PricingCadence
  isActive: boolean
  baseNightlyRate?: number | null
  targetOccupancyPct?: number | null
  marketName?: string | null
}

type RevenueSnapshot = {
  id: string
  periodStart: string
  periodEnd: string
  label?: string | null
  grossRevenue?: number | null
  occupancyPct?: number | null
  adr?: number | null
  nightsBooked?: number | null
  nightsAvailable?: number | null
  marketOccupancyPct?: number | null
  marketAdr?: number | null
  future30Revenue?: number | null
  future60Revenue?: number | null
  future90Revenue?: number | null
  cleaningFeesCollected?: number | null
  cancellationsCount?: number | null
  cancellationRevenueLost?: number | null
  revenueReportUrl?: string | null
  dashboardUrl?: string | null
  keyInsights?: string | null
  pricingDecisionsSummary?: string | null
  createdAt?: string | null
}

type Property = {
  id: string
  name?: string | null
  nickname?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  revenueProfile?: RevenueProfile | null
  revenueSnapshots?: {
    items?: RevenueSnapshot[]
    nextToken?: string | null
  } | null
}

type GetOwnerPropertyRevenueResponse = {
  getProperty?: Property | null
}

// ------------- Helpers -------------

function formatCurrency(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '-'
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatPercent(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '-'
  return `${value.toFixed(0)}%`
}

function formatShortDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
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
      return 'Weekly pricing updates'
    case 'DAILY':
      return 'Daily pricing optimization'
    default:
      return cadence
  }
}

// ------------- Component -------------

export default function OwnerPropertyRevenuePage() {
  const router = useRouter()
  const { id } = router.query

  const [property, setProperty] = useState<Property | null>(null)
  const [snapshots, setSnapshots] = useState<RevenueSnapshot[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || typeof id !== 'string') return

    let isMounted = true

    async function load() {
      console.log('[OwnerRevenue] Loading owner revenue dashboard for property id=', id)
      setLoading(true)
      setError(null)

      try {
        const response = await client.graphql({
          query: GET_OWNER_PROPERTY_REVENUE,
          variables: {
            id,
            snapLimit: 12,
            snapNextToken: null,
          },
        })

        const data = (response as { data?: GetOwnerPropertyRevenueResponse }).data
        const prop = data?.getProperty ?? null

        if (!isMounted) return

        if (!prop) {
          console.warn('[OwnerRevenue] Property not found for id', id)
          setError('We could not find this property. Please contact Latimere support.')
          setProperty(null)
          setSnapshots([])
          return
        }

        setProperty(prop)
        setSnapshots(prop.revenueSnapshots?.items ?? [])
        console.log(
          '[OwnerRevenue] Loaded property for owner, snapshot count =',
          prop.revenueSnapshots?.items?.length ?? 0
        )
      } catch (err) {
        console.error('[OwnerRevenue] Error loading owner revenue dashboard:', err)
        if (!isMounted) return
        setError('Something went wrong while loading revenue. Please try again or contact Latimere support.')
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
  }, [id])

  const latestSnapshot = snapshots[0]
  const propertyTitle =
    property?.nickname || property?.name || (property ? `Property ${property.id}` : '')

  return (
    <>
      <Head>
        <title>
          {propertyTitle
            ? `${propertyTitle} — Revenue Dashboard`
            : 'Latimere Revenue Dashboard'}
        </title>
      </Head>

      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          {/* Header */}
          <header className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
              Latimere Revenue Management
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-50">
              {propertyTitle || 'Your Property'}
            </h1>
            {property && (
              <p className="mt-1 text-sm text-slate-400">
                {[property.city, property.state, property.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
            <p className="mt-3 text-sm text-slate-300">
              This dashboard shows how your property is performing and how Latimere
              is optimizing your pricing each month.
            </p>
          </header>

          {/* Loading / Error */}
          {loading && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-200">
              Loading your revenue dashboard...
            </div>
          )}

          {error && !loading && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {!loading && property && (
            <>
              {/* Top Summary Row */}
              <section className="mb-6 grid gap-4 md:grid-cols-3">
                {/* Tier / Plan */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Your Latimere plan
                  </h2>
                  {property.revenueProfile ? (
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="text-slate-100">
                        {tierDisplay(property.revenueProfile.tier)}
                      </div>
                      <div className="text-slate-300">
                        {cadenceDisplay(property.revenueProfile.pricingCadence)}
                      </div>
                      {property.revenueProfile.marketName && (
                        <div className="text-xs text-slate-400">
                          Market: {property.revenueProfile.marketName}
                        </div>
                      )}
                      {property.revenueProfile.baseNightlyRate != null && (
                        <div className="text-xs text-slate-400">
                          Base rate target:{' '}
                          {formatCurrency(property.revenueProfile.baseNightlyRate)}
                          /night
                        </div>
                      )}
                      <div className="pt-2 text-xs">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium">
                          {property.revenueProfile.isActive ? (
                            <span className="bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40 rounded-full px-2 py-0.5">
                              Revenue management active
                            </span>
                          ) : (
                            <span className="bg-slate-800 text-slate-300 ring-1 ring-slate-600/60 rounded-full px-2 py-0.5">
                              Paused — contact Latimere to resume
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">
                      Your property is not yet configured for Latimere Revenue
                      Management. Please contact us if this seems incorrect.
                    </p>
                  )}
                </div>

                {/* Last Month Summary */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Latest month performance
                  </h2>
                  {latestSnapshot ? (
                    <div className="mt-3 space-y-3 text-sm">
                      <div>
                        <div className="text-xs text-slate-400">Period</div>
                        <div className="text-sm font-medium text-slate-100">
                          {latestSnapshot.label || 'Latest month'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatShortDate(latestSnapshot.periodStart)} —{' '}
                          {formatShortDate(latestSnapshot.periodEnd)}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <div className="text-xs text-slate-400">
                            Gross revenue
                          </div>
                          <div className="text-base font-semibold text-cyan-300">
                            {formatCurrency(latestSnapshot.grossRevenue ?? 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">
                            Occupancy
                          </div>
                          <div className="text-base font-semibold text-slate-100">
                            {formatPercent(latestSnapshot.occupancyPct ?? 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">
                            Average rate
                          </div>
                          <div className="text-base font-semibold text-slate-100">
                            {formatCurrency(latestSnapshot.adr ?? 0)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                        <div>
                          <div className="text-slate-400">Nights booked</div>
                          <div>
                            {latestSnapshot.nightsBooked ?? '—'}{' '}
                            <span className="text-slate-500">
                              / {latestSnapshot.nightsAvailable ?? '—'} nights
                              available
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Cleaning fees</div>
                          <div>
                            {formatCurrency(
                              latestSnapshot.cleaningFeesCollected ?? 0
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">
                      We haven&apos;t added your first month of metrics yet.
                      Once we do, you&apos;ll see revenue and occupancy here.
                    </p>
                  )}
                </div>

                {/* Forward Looking */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Forward 90-day booking outlook
                  </h2>
                  {latestSnapshot ? (
                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs text-slate-400">Next 30 days</div>
                        <div className="text-sm font-medium text-slate-100">
                          {formatCurrency(latestSnapshot.future30Revenue ?? 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Next 60 days</div>
                        <div className="text-sm font-medium text-slate-100">
                          {formatCurrency(latestSnapshot.future60Revenue ?? 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Next 90 days</div>
                        <div className="text-sm font-medium text-slate-100">
                          {formatCurrency(latestSnapshot.future90Revenue ?? 0)}
                        </div>
                      </div>

                      <p className="pt-2 text-xs text-slate-400">
                        These numbers are based on current bookings and Latimere&apos;s
                        pricing strategy. We adjust your rates regularly to capture
                        demand while protecting your average nightly rate.
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">
                      Once your first month of data is in, we&apos;ll start
                      showing forward-looking booking revenue here.
                    </p>
                  )}
                </div>
              </section>

              {/* Market Comparison + Insights */}
              {latestSnapshot && (
                <section className="mb-8 grid gap-4 md:grid-cols-2">
                  {/* Market comparison */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                    <h2 className="text-sm font-semibold text-slate-100">
                      How you compare to the market
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      We use third-party market data (e.g., AirDNA) to compare
                      your property to similar listings in your area.
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-slate-950/40 p-3">
                        <div className="text-xs text-slate-400">
                          Occupancy rate
                        </div>
                        <div className="mt-1 text-sm text-slate-100">
                          You: {formatPercent(latestSnapshot.occupancyPct ?? 0)}
                        </div>
                        <div className="text-xs text-slate-400">
                          Market:{' '}
                          {formatPercent(
                            latestSnapshot.marketOccupancyPct ?? 0
                          )}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-950/40 p-3">
                        <div className="text-xs text-slate-400">
                          Average nightly rate
                        </div>
                        <div className="mt-1 text-sm text-slate-100">
                          You: {formatCurrency(latestSnapshot.adr ?? 0)}
                        </div>
                        <div className="text-xs text-slate-400">
                          Market:{' '}
                          {formatCurrency(latestSnapshot.marketAdr ?? 0)}
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-400">
                      Our goal is to keep you ahead of the market on total revenue,
                      not just occupancy or nightly rate alone.
                    </p>
                  </div>

                  {/* Insights card */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                    <h2 className="text-sm font-semibold text-slate-100">
                      What happened this month
                    </h2>

                    <div className="mt-3 space-y-3 text-sm">
                      <div>
                        <div className="text-xs font-medium text-cyan-300">
                          Summary insight
                        </div>
                        <p className="mt-1 text-sm text-slate-200">
                          {latestSnapshot.keyInsights ||
                            'Once we complete your first full month of optimization, we’ll write a short plain-English summary of what changed and how it impacted your revenue.'}
                        </p>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-cyan-300">
                          Pricing strategy we used
                        </div>
                        <p className="mt-1 text-xs text-slate-300">
                          {latestSnapshot.pricingDecisionsSummary ||
                            'We adjust your base price, weekend premiums, minimum stays, and gap-night discounts based on demand, events, and booking patterns.'}
                        </p>
                      </div>
                    </div>

                    {latestSnapshot.revenueReportUrl && (
                      <div className="mt-4">
                        <a
                          href={latestSnapshot.revenueReportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
                        >
                          View full monthly report (PDF)
                        </a>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* History table */}
              <section className="mb-10 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <h2 className="text-sm font-semibold text-slate-100">
                  Revenue history
                </h2>
                {snapshots.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">
                    Once we&apos;ve managed your pricing for a few months, you&apos;ll
                    see a history of performance here.
                  </p>
                ) : (
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800 text-xs md:text-sm">
                      <thead>
                        <tr className="bg-slate-950">
                          <th className="px-3 py-2 text-left font-medium text-slate-300">
                            Month
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-slate-300">
                            Revenue
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-slate-300">
                            Occupancy
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-slate-300">
                            ADR
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-slate-300">
                            Nights booked
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-slate-300">
                            Summary
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {snapshots.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-950/60">
                            <td className="px-3 py-2 align-top">
                              <div className="font-medium text-slate-100">
                                {s.label || 'Month'}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {formatShortDate(s.periodStart)} –{' '}
                                {formatShortDate(s.periodEnd)}
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top text-right text-slate-50">
                              {formatCurrency(s.grossRevenue ?? 0)}
                            </td>
                            <td className="px-3 py-2 align-top text-right text-slate-50">
                              {formatPercent(s.occupancyPct ?? 0)}
                            </td>
                            <td className="px-3 py-2 align-top text-right text-slate-50">
                              {formatCurrency(s.adr ?? 0)}
                            </td>
                            <td className="px-3 py-2 align-top text-right text-slate-50">
                              {s.nightsBooked ?? '—'}
                              <span className="text-slate-400">
                                {' '}
                                / {s.nightsAvailable ?? '—'}
                              </span>
                            </td>
                            <td className="px-3 py-2 align-top text-slate-200">
                              <div className="max-w-xs text-xs text-slate-300">
                                {s.keyInsights || '—'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Footer blurb */}
              <section className="mb-4 text-xs text-slate-500">
                If you have questions about this dashboard or want to upgrade your
                plan, please reach out to Latimere. We can walk you through the
                numbers and next steps.
              </section>
            </>
          )}
        </div>
      </main>
    </>
  )
}

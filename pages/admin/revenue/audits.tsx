// pages/admin/revenue/audits.tsx
/* eslint-disable no-console */
import { useEffect, useState, FormEvent } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { generateClient, GRAPHQL_AUTH_MODE } from 'aws-amplify/api'

const client = generateClient()

// Client-side flag for extra logging, if you want to flip it with an env var
const debugRevenueClient =
  typeof window !== 'undefined' &&
  (process.env.NEXT_PUBLIC_DEBUG_REVENUE === '1' ||
    process.env.NEXT_PUBLIC_DEBUG_REFERRALS === '1')

// ---- GraphQL ----

const LIST_REVENUE_AUDITS = /* GraphQL */ `
  query ListRevenueAudits($limit: Int, $nextToken: String) {
    listRevenueAudits(limit: $limit, nextToken: $nextToken) {
      items {
        id
        owner
        ownerName
        ownerEmail
        listingUrl
        marketName
        estimatedAnnualRevenueCurrent
        estimatedAnnualRevenueOptimized
        projectedGainPct
        underpricingIssues
        competitorSummary
        recommendations
        createdAt
      }
      nextToken
    }
  }
`

const UPDATE_REVENUE_AUDIT = /* GraphQL */ `
  mutation UpdateRevenueAudit($input: UpdateRevenueAuditInput!) {
    updateRevenueAudit(input: $input) {
      id
      estimatedAnnualRevenueCurrent
      estimatedAnnualRevenueOptimized
      projectedGainPct
      underpricingIssues
      competitorSummary
      recommendations
      updatedAt
    }
  }
`

// ---- Types ----

type RevenueAudit = {
  id: string
  owner?: string | null
  ownerName?: string | null
  ownerEmail?: string | null
  listingUrl?: string | null
  marketName?: string | null
  estimatedAnnualRevenueCurrent?: number | null
  estimatedAnnualRevenueOptimized?: number | null
  projectedGainPct?: number | null
  underpricingIssues?: string | null
  competitorSummary?: string | null
  recommendations?: string | null
  createdAt?: string | null
}

type ListRevenueAuditsResponse = {
  listRevenueAudits?: {
    items?: RevenueAudit[]
    nextToken?: string | null
  } | null
}

function formatCurrency(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '-'
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ---- Component ----

export default function AdminRevenueAuditsPage() {
  const [audits, setAudits] = useState<RevenueAudit[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null)

  // Edit form state
  const [editCurrentAnnual, setEditCurrentAnnual] = useState<string>('')
  const [editOptimizedAnnual, setEditOptimizedAnnual] = useState<string>('')
  const [editProjectedGainPct, setEditProjectedGainPct] = useState<string>('')
  const [editUnderpricingIssues, setEditUnderpricingIssues] =
    useState<string>('')
  const [editCompetitorSummary, setEditCompetitorSummary] =
    useState<string>('')
  const [editRecommendations, setEditRecommendations] = useState<string>('')

  const [saving, setSaving] = useState<boolean>(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadAudits() {
      console.log('[AdminAudits] Loading revenue audits...')
      setLoading(true)
      setError(null)

      try {
        const allItems: RevenueAudit[] = []
        let nextToken: string | null | undefined = null

        do {
          const response = await client.graphql({
            query: LIST_REVENUE_AUDITS,
            variables: {
              limit: 50,
              nextToken: nextToken ?? null,
            },
            authMode: GRAPHQL_AUTH_MODE.API_KEY,
          })

          const { data, errors } = response as {
            data?: ListRevenueAuditsResponse
            errors?: unknown
          }

          if (errors) {
            console.error(
              '[AdminAudits] GraphQL errors from listRevenueAudits:',
              errors
            )
            throw new Error('GraphQL error while listing revenue audits')
          }

          const page = data?.listRevenueAudits?.items ?? []
          nextToken = data?.listRevenueAudits?.nextToken ?? null

          if (debugRevenueClient) {
            console.log(
              '[AdminAudits] Page loaded:',
              page.length,
              'items, nextToken=',
              nextToken
            )
          }

          allItems.push(...page.filter(Boolean))
        } while (nextToken)

        if (!isMounted) return

        // Sort newest first
        allItems.sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return db - da
        })

        setAudits(allItems)
        console.log('[AdminAudits] Total audits loaded:', allItems.length)
      } catch (err) {
        console.error('[AdminAudits] Error loading audits:', err)
        if (!isMounted) return
        setError('Failed to load revenue audits. Check console logs for details.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void loadAudits()
    return () => {
      isMounted = false
    }
  }, [])

  function onSelectAudit(audit: RevenueAudit) {
    console.log('[AdminAudits] Selected audit id=', audit.id)
    setSelectedAuditId(audit.id)
    setSaveError(null)
    setSaveSuccess(null)

    setEditCurrentAnnual(
      audit.estimatedAnnualRevenueCurrent != null
        ? String(audit.estimatedAnnualRevenueCurrent)
        : ''
    )
    setEditOptimizedAnnual(
      audit.estimatedAnnualRevenueOptimized != null
        ? String(audit.estimatedAnnualRevenueOptimized)
        : ''
    )
    setEditProjectedGainPct(
      audit.projectedGainPct != null ? String(audit.projectedGainPct) : ''
    )
    setEditUnderpricingIssues(audit.underpricingIssues || '')
    setEditCompetitorSummary(audit.competitorSummary || '')
    setEditRecommendations(audit.recommendations || '')
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaveError(null)
    setSaveSuccess(null)

    if (!selectedAuditId) {
      setSaveError('No audit selected.')
      return
    }

    setSaving(true)
    console.log('[AdminAudits] Saving audit id=', selectedAuditId)

    try {
      const input: Record<string, any> = {
        id: selectedAuditId,
      }

      if (editCurrentAnnual.trim()) {
        input.estimatedAnnualRevenueCurrent = parseFloat(editCurrentAnnual)
      } else {
        input.estimatedAnnualRevenueCurrent = null
      }

      if (editOptimizedAnnual.trim()) {
        input.estimatedAnnualRevenueOptimized = parseFloat(editOptimizedAnnual)
      } else {
        input.estimatedAnnualRevenueOptimized = null
      }

      if (editProjectedGainPct.trim()) {
        input.projectedGainPct = parseFloat(editProjectedGainPct)
      } else {
        input.projectedGainPct = null
      }

      input.underpricingIssues = editUnderpricingIssues.trim() || null
      input.competitorSummary = editCompetitorSummary.trim() || null
      input.recommendations = editRecommendations.trim() || null

      if (debugRevenueClient) {
        console.log('[AdminAudits] UpdateRevenueAudit input:', input)
      }

      const response = await client.graphql({
        query: UPDATE_REVENUE_AUDIT,
        variables: { input },
        authMode: GRAPHQL_AUTH_MODE.API_KEY,
      })

      const { data, errors } = response as {
        data?: { updateRevenueAudit?: RevenueAudit | null }
        errors?: unknown
      }

      if (errors) {
        console.error(
          '[AdminAudits] GraphQL errors from updateRevenueAudit:',
          errors
        )
        throw new Error('GraphQL error while updating revenue audit')
      }

      const updated = data?.updateRevenueAudit ?? null

      if (!updated) {
        console.warn('[AdminAudits] updateRevenueAudit returned null')
        setSaveError('No update was returned from the server.')
        return
      }

      setAudits((prev) =>
        prev.map((a) =>
          a.id === updated.id
            ? {
                ...a,
                estimatedAnnualRevenueCurrent:
                  updated.estimatedAnnualRevenueCurrent,
                estimatedAnnualRevenueOptimized:
                  updated.estimatedAnnualRevenueOptimized,
                projectedGainPct: updated.projectedGainPct,
                underpricingIssues: updated.underpricingIssues,
                competitorSummary: updated.competitorSummary,
                recommendations: updated.recommendations,
              }
            : a
        )
      )

      setSaveSuccess('Audit updated successfully.')
      console.log('[AdminAudits] Audit updated:', updated)
    } catch (err) {
      console.error('[AdminAudits] Error updating audit:', err)
      setSaveError('Failed to save audit. Check console logs for details.')
    } finally {
      setSaving(false)
    }
  }

  const selectedAudit =
    selectedAuditId != null
      ? audits.find((a) => a.id === selectedAuditId) ?? null
      : null

  return (
    <>
      <Head>
        <title>Revenue Audits — Admin | Latimere</title>
      </Head>
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                Latimere Revenue Management
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-50">
                Revenue Audits (Lead Magnet)
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                These are free audit requests submitted via the public form. Complete
                the quick analysis and convert the strong ones into full Latimere
                Revenue Management clients.
              </p>
            </div>
            <div className="text-xs text-slate-400">
              <Link
                href="/revenue-audit"
                className="rounded-full border border-slate-600 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800/80"
              >
                View public form
              </Link>
            </div>
          </header>

          {loading && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-200">
              Loading revenue audits...
            </div>
          )}

          {error && !loading && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              {/* Left: table */}
              <section className="rounded-xl border border-slate-800 bg-slate-900/70">
                <div className="border-b border-slate-800 px-4 py-3">
                  <h2 className="text-sm font-semibold text-slate-100">
                    Incoming audits
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Click a row to review and complete the audit details.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800 text-xs md:text-sm">
                    <thead className="bg-slate-950">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-slate-300">
                          Owner
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-slate-300">
                          Market
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-slate-300">
                          Current est.
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-slate-300">
                          Optimized est.
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-slate-300">
                          Gain %
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-slate-300">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {audits.map((a) => {
                        const isSelected = a.id === selectedAuditId
                        return (
                          <tr
                            key={a.id}
                            className={`cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900/90'
                                : 'hover:bg-slate-950/70'
                            }`}
                            onClick={() => onSelectAudit(a)}
                          >
                            <td className="px-3 py-2 align-top">
                              <div className="font-medium text-slate-100">
                                {a.ownerName || 'Unknown owner'}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {a.ownerEmail || '—'}
                              </div>
                              {a.listingUrl && (
                                <div className="mt-1 text-[11px]">
                                  <a
                                    href={a.listingUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-cyan-300 hover:text-cyan-200"
                                  >
                                    View listing
                                  </a>
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 align-top text-slate-200">
                              {a.marketName || '—'}
                            </td>
                            <td className="px-3 py-2 align-top text-right text-slate-100">
                              {formatCurrency(a.estimatedAnnualRevenueCurrent)}
                            </td>
                            <td className="px-3 py-2 align-top text-right text-slate-100">
                              {formatCurrency(a.estimatedAnnualRevenueOptimized)}
                            </td>
                            <td className="px-3 py-2 align-top text-right text-slate-100">
                              {a.projectedGainPct != null
                                ? `${a.projectedGainPct.toFixed(0)}%`
                                : '—'}
                            </td>
                            <td className="px-3 py-2 align-top text-right text-slate-400">
                              {formatDate(a.createdAt)}
                            </td>
                          </tr>
                        )
                      })}

                      {audits.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-6 text-center text-xs text-slate-400"
                          >
                            No revenue audits yet. Once owners submit the free
                            audit form, they&apos;ll appear here.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Right: edit panel */}
              <section className="rounded-xl border border-slate-800 bg-slate-900/70">
                <div className="border-b border-slate-800 px-4 py-3">
                  <h2 className="text-sm font-semibold text-slate-100">
                    Audit details
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Fill in your quick analysis to quantify how much revenue Latimere
                    can unlock for this owner.
                  </p>
                </div>

                {!selectedAudit && (
                  <div className="p-4 text-xs text-slate-400">
                    Select an audit from the left to review its details.
                  </div>
                )}

                {selectedAudit && (
                  <form onSubmit={handleSave} className="space-y-3 p-4 text-xs">
                    <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
                      <div className="text-[11px] font-semibold text-slate-200">
                        {selectedAudit.ownerName || 'Unknown owner'}
                      </div>
                      {selectedAudit.ownerEmail && (
                        <div className="text-[11px] text-slate-400">
                          {selectedAudit.ownerEmail}
                        </div>
                      )}
                      {selectedAudit.marketName && (
                        <div className="mt-1 text-[11px] text-slate-400">
                          Market: {selectedAudit.marketName}
                        </div>
                      )}
                      {selectedAudit.listingUrl && (
                        <div className="mt-2 text-[11px]">
                          <a
                            href={selectedAudit.listingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-300 hover:text-cyan-200"
                          >
                            Open Airbnb / VRBO listing
                          </a>
                        </div>
                      )}
                    </div>

                    {saveError && (
                      <div className="rounded-md border border-red-500/40 bg-red-950/40 p-2 text-[11px] text-red-200">
                        {saveError}
                      </div>
                    )}
                    {saveSuccess && (
                      <div className="rounded-md border border-emerald-500/40 bg-emerald-950/40 p-2 text-[11px] text-emerald-200">
                        {saveSuccess}
                      </div>
                    )}

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300">
                          Est. annual revenue (current)
                        </label>
                        <input
                          type="number"
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-50 outline-none focus:border-cyan-400"
                          placeholder="e.g. 65000"
                          value={editCurrentAnnual}
                          onChange={(e) => setEditCurrentAnnual(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300">
                          Est. annual revenue (optimized)
                        </label>
                        <input
                          type="number"
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-50 outline-none focus:border-cyan-400"
                          placeholder="e.g. 85000"
                          value={editOptimizedAnnual}
                          onChange={(e) => setEditOptimizedAnnual(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300">
                        Projected revenue gain %
                      </label>
                      <input
                        type="number"
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-50 outline-none focus:border-cyan-400"
                        placeholder="e.g. 28"
                        value={editProjectedGainPct}
                        onChange={(e) =>
                          setEditProjectedGainPct(e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300">
                        Underpricing issues (bullet points)
                      </label>
                      <textarea
                        className="mt-1 h-20 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-50 outline-none focus:border-cyan-400"
                        value={editUnderpricingIssues}
                        onChange={(e) =>
                          setEditUnderpricingIssues(e.target.value)
                        }
                        placeholder="- Weekends priced too low
- Peak season not differentiated
- Minimum stays leaving gaps..."
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300">
                        Competitor summary (3 comps)
                      </label>
                      <textarea
                        className="mt-1 h-20 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-50 outline-none focus:border-cyan-400"
                        value={editCompetitorSummary}
                        onChange={(e) =>
                          setEditCompetitorSummary(e.target.value)
                        }
                        placeholder="Comp 1 — $X ADR, Y% occupancy, hot tub
Comp 2 — ...
Comp 3 — ..."
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300">
                        Recommendations (what Latimere would do)
                      </label>
                      <textarea
                        className="mt-1 h-24 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-50 outline-none focus:border-cyan-400"
                        value={editRecommendations}
                        onChange={(e) =>
                          setEditRecommendations(e.target.value)
                        }
                        placeholder="e.g. Raise base rate by 10–15%, tighten minimum stays on weekends, add last-minute discounts for mid-week gaps..."
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {saving ? 'Saving audit...' : 'Save audit details'}
                      </button>
                      <p className="text-[11px] text-slate-500">
                        Use these numbers &amp; notes when emailing the owner
                        your free revenue audit.
                      </p>
                    </div>
                  </form>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

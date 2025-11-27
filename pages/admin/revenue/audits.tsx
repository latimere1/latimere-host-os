// pages/admin/revenue/audits.tsx
/* eslint-disable no-console */
import { FormEvent, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { generateClient } from 'aws-amplify/api'

const client = generateClient()

const debugRevenueClient =
  typeof window !== 'undefined' &&
  (process.env.NEXT_PUBLIC_DEBUG_REVENUE === '1' ||
    process.env.NEXT_PUBLIC_DEBUG_REFERRALS === '1')

// ---- GraphQL ----

const LIST_REVENUE_AUDITS = /* GraphQL */ `
  query ListRevenueAudits(
    $limit: Int
    $nextToken: String
    $filter: ModelRevenueAuditFilterInput
  ) {
    listRevenueAudits(limit: $limit, nextToken: $nextToken, filter: $filter) {
      items {
        id
        propertyId

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
        updatedAt
      }
      nextToken
    }
  }
`

type RevenueAuditApi = {
  id: string
  propertyId?: string | null

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
  updatedAt?: string | null

  [key: string]: any
}

type RevenueAuditRow = {
  id: string
  listingLabel: string
  ownerName?: string
  marketName?: string
  listingUrl?: string

  estimatedCurrent?: number
  estimatedOptimized?: number
  upliftPct?: number

  underpricingIssues?: string
  competitorSummary?: string
  recommendations?: string

  createdAt?: string
  selected: boolean
  raw: RevenueAuditApi
}

type EmailPreviewState =
  | {
      open: true
      loading: boolean
      subject: string
      html: string
      text: string
      error: string | null
    }
  | {
      open: false
      loading: boolean
      subject: ''
      html: ''
      text: ''
      error: null
    }

// ---- Helpers ----

function formatCurrency(amount?: number): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return ''
  }
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function formatPct(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return ''
  return `${value.toFixed(1)}%`
}

function buildListingLabel(a: RevenueAuditApi): string {
  const pieces = [
    a.marketName || '',
    a.listingUrl || '',
    a.ownerName ? `Owner: ${a.ownerName}` : '',
  ].filter(Boolean)
  if (pieces.length === 0) {
    return `Property ${a.propertyId || a.id}`
  }
  return pieces.join(' • ')
}

function normaliseAuditItem(item: RevenueAuditApi): RevenueAuditRow {
  return {
    id: item.id,
    listingLabel: buildListingLabel(item),
    ownerName: item.ownerName || undefined,
    marketName: item.marketName || undefined,
    listingUrl: item.listingUrl || undefined,
    estimatedCurrent:
      typeof item.estimatedAnnualRevenueCurrent === 'number'
        ? item.estimatedAnnualRevenueCurrent
        : undefined,
    estimatedOptimized:
      typeof item.estimatedAnnualRevenueOptimized === 'number'
        ? item.estimatedAnnualRevenueOptimized
        : undefined,
    upliftPct:
      typeof item.projectedGainPct === 'number'
        ? item.projectedGainPct
        : undefined,
    underpricingIssues: item.underpricingIssues || undefined,
    competitorSummary: item.competitorSummary || undefined,
    recommendations: item.recommendations || undefined,
    createdAt: item.createdAt || undefined,
    selected: false,
    raw: item,
  }
}

// ---- Component ----

export default function RevenueAuditsPage() {
  const [audits, setAudits] = useState<RevenueAuditRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [periodLabel, setPeriodLabel] = useState<string>('')
  const [recipientName, setRecipientName] = useState<string>('')
  const [introNote, setIntroNote] = useState<string>('')

  const [emailPreview, setEmailPreview] = useState<EmailPreviewState>({
    open: false,
    loading: false,
    subject: '',
    html: '',
    text: '',
    error: null,
  })

  const [copyStatus, setCopyStatus] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadAudits() {
      setLoading(true)
      setLoadError(null)

      const requestId = `audits-load-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`

      try {
        if (debugRevenueClient) {
          console.log(`[${requestId}] Loading revenue audits...`)
        }

        const resp = await client.graphql({
          query: LIST_REVENUE_AUDITS,
          variables: {
            limit: 200,
          },
        })

        const data = (resp as any).data
        const connection = data?.listRevenueAudits
        const items: RevenueAuditApi[] = connection?.items || []

        if (debugRevenueClient) {
          console.log(
            `[${requestId}] Loaded ${items.length} revenue audits`,
            items,
          )
        }

        if (!cancelled) {
          setAudits(items.map(normaliseAuditItem))
        }
      } catch (err) {
        console.error('Error loading revenue audits', err)
        if (!cancelled) {
          setLoadError('Failed to load revenue audits. Check console logs.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadAudits()

    return () => {
      cancelled = true
    }
  }, [])

  const onToggleSelectAudit = (id: string) => {
    setAudits((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              selected: !a.selected,
            }
          : a,
      ),
    )
  }

  const onToggleSelectAll = (checked: boolean) => {
    setAudits((prev) => prev.map((a) => ({ ...a, selected: checked })))
  }

  const onGenerateAuditEmail = async (e?: FormEvent) => {
    e?.preventDefault()

    const requestId = `audit-email-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`

    const selected = audits.filter((a) => a.selected)
    const payloadAudits = (selected.length > 0 ? selected : audits).map(
      (row) => ({
        id: row.id,
        propertyId: row.raw.propertyId || null,

        ownerName: row.ownerName || null,
        ownerEmail: row.raw.ownerEmail || null,
        listingUrl: row.listingUrl || null,
        marketName: row.marketName || null,

        estimatedAnnualRevenueCurrent: row.estimatedCurrent ?? null,
        estimatedAnnualRevenueOptimized: row.estimatedOptimized ?? null,
        projectedGainPct: row.upliftPct ?? null,

        underpricingIssues: row.underpricingIssues || null,
        competitorSummary: row.competitorSummary || null,
        recommendations: row.recommendations || null,

        createdAt: row.createdAt || null,
      }),
    )

    if (payloadAudits.length === 0) {
      setEmailPreview({
        open: true,
        loading: false,
        subject: '',
        html: '',
        text: '',
        error:
          'There are no audits loaded to generate an email. Try refreshing the page.',
      })
      return
    }

    if (debugRevenueClient) {
      console.log(
        `[${requestId}] Generating audit email preview for ${payloadAudits.length} audits (selected=${selected.length})`,
        payloadAudits,
      )
    }

    setEmailPreview({
      open: true,
      loading: true,
      subject: '',
      html: '',
      text: '',
      error: null,
    })
    setCopyStatus(null)

    try {
      const resp = await fetch('/api/admin/revenue/audit-email-preview', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          audits: payloadAudits,
          periodLabel: periodLabel || null,
          recipientName: recipientName || null,
          introNote: introNote || null,
        }),
      })

      const json = (await resp.json()) as {
        ok?: boolean
        subject?: string
        html?: string
        text?: string
        error?: string
      }

      if (!resp.ok || !json.ok) {
        const errorMessage =
          json.error ||
          `Request failed with status ${resp.status} (${resp.statusText})`
        if (debugRevenueClient) {
          console.error(
            `[${requestId}] audit-email-preview request failed`,
            errorMessage,
          )
        }
        setEmailPreview((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }))
        return
      }

      if (debugRevenueClient) {
        console.log(
          `[${requestId}] audit-email-preview success`,
          json.subject,
          {
            textLength: json.text?.length ?? 0,
            htmlLength: json.html?.length ?? 0,
          },
        )
      }

      setEmailPreview({
        open: true,
        loading: false,
        subject: json.subject || '',
        html: json.html || '',
        text: json.text || '',
        error: null,
      })
    } catch (err) {
      console.error(`[${requestId}] audit-email-preview error`, err)
      setEmailPreview((prev) => ({
        ...prev,
        loading: false,
        error: 'Unexpected error generating audit email preview.',
      }))
    }
  }

  const onClosePreview = () => {
    setEmailPreview({
      open: false,
      loading: false,
      subject: '',
      html: '',
      text: '',
      error: null,
    })
    setCopyStatus(null)
  }

  const copyToClipboard = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyStatus(`${label} copied`)
      if (debugRevenueClient) {
        console.log(`audit-email-preview: copied ${label}`)
      }
      setTimeout(() => {
        setCopyStatus(null)
      }, 2000)
    } catch (err) {
      console.error(`Failed to copy ${label}`, err)
      setCopyStatus(`Failed to copy ${label}`)
      setTimeout(() => {
        setCopyStatus(null)
      }, 3000)
    }
  }

  const anySelected = audits.some((a) => a.selected)
  const allSelected = audits.length > 0 && audits.every((a) => a.selected)

  return (
    <>
      <Head>
        <title>Revenue audits | Latimere</title>
      </Head>

      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <header className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Revenue audits</h1>
              <p className="mt-1 text-sm text-slate-400">
                Admin view of revenue optimization audits and recommendations.
              </p>
            </div>
            <Link
              href="/admin/revenue"
              className="rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
            >
              ← Back to revenue
            </Link>
          </header>

          <section className="mb-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-sm font-semibold text-slate-200">
              Audit email preview
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Select specific audits below (or leave all unselected to include
              every row), then generate an email summary you can paste into your
              email client.
            </p>

            <form
              onSubmit={onGenerateAuditEmail}
              className="mt-3 grid gap-3 md:grid-cols-3"
            >
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Recipient name (optional)
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g. Kevin"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Period label (optional)
                </label>
                <input
                  type="text"
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g. November 2025, Q4 2025, etc."
                />
              </div>

              <div className="space-y-1 md:col-span-1">
                <label className="block text-xs font-medium text-slate-300">
                  Intro note (optional)
                </label>
                <input
                  type="text"
                  value={introNote}
                  onChange={(e) => setIntroNote(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  placeholder="Short context for the email"
                />
              </div>

              <div className="mt-2 md:col-span-3 flex items-center justify-between gap-2">
                <div className="text-xs text-slate-400">
                  {anySelected
                    ? `${audits.filter((a) => a.selected).length} audit(s) selected.`
                    : audits.length > 0
                    ? `No rows selected: all ${audits.length} audit(s) will be included.`
                    : 'No audits loaded yet.'}
                </div>
                <button
                  type="submit"
                  disabled={audits.length === 0}
                  className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {emailPreview.loading ? 'Generating…' : 'Generate audit email'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
              <h2 className="text-sm font-semibold text-slate-200">
                Audit records
              </h2>
              {loading && (
                <div className="text-xs text-slate-400">Loading…</div>
              )}
              {loadError && (
                <div className="text-xs text-red-400">{loadError}</div>
              )}
            </div>

            <div className="max-h-[540px] overflow-auto text-xs">
              <table className="min-w-full border-collapse">
                <thead className="bg-slate-900/80">
                  <tr>
                    <th className="sticky top-0 border-b border-slate-800 bg-slate-900/90 px-2 py-2 text-left text-[11px] font-medium text-slate-400">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) =>
                          onToggleSelectAll(e.target.checked)
                        }
                      />
                    </th>
                    <th className="sticky top-0 border-b border-slate-800 bg-slate-900/90 px-2 py-2 text-left text-[11px] font-medium text-slate-400">
                      Listing
                    </th>
                    <th className="sticky top-0 border-b border-slate-800 bg-slate-900/90 px-2 py-2 text-right text-[11px] font-medium text-slate-400">
                      Current
                    </th>
                    <th className="sticky top-0 border-b border-slate-800 bg-slate-900/90 px-2 py-2 text-right text-[11px] font-medium text-slate-400">
                      Optimized
                    </th>
                    <th className="sticky top-0 border-b border-slate-800 bg-slate-900/90 px-2 py-2 text-right text-[11px] font-medium text-slate-400">
                      Uplift
                    </th>
                    <th className="sticky top-0 border-b border-slate-800 bg-slate-900/90 px-2 py-2 text-left text-[11px] font-medium text-slate-400">
                      Recommendations
                    </th>
                    <th className="sticky top-0 border-b border-slate-800 bg-slate-900/90 px-2 py-2 text-left text-[11px] font-medium text-slate-400">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {audits.length === 0 && !loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-6 text-center text-xs text-slate-500"
                      >
                        No audits found.
                      </td>
                    </tr>
                  ) : (
                    audits.map((audit) => (
                      <tr
                        key={audit.id}
                        className="border-b border-slate-800/60 hover:bg-slate-900/70"
                      >
                        <td className="px-2 py-1 align-top">
                          <input
                            type="checkbox"
                            checked={audit.selected}
                            onChange={() => onToggleSelectAudit(audit.id)}
                          />
                        </td>
                        <td className="px-2 py-1 align-top">
                          <div className="font-medium text-slate-100">
                            {audit.listingLabel}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-2 py-1 text-right align-top">
                          {audit.estimatedCurrent != null ? (
                            <span className="text-slate-100">
                              {formatCurrency(audit.estimatedCurrent)}
                            </span>
                          ) : (
                            <span className="text-slate-500">n/a</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-2 py-1 text-right align-top">
                          {audit.estimatedOptimized != null ? (
                            <span className="text-emerald-300">
                              {formatCurrency(audit.estimatedOptimized)}
                            </span>
                          ) : (
                            <span className="text-slate-500">n/a</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-2 py-1 text-right align-top">
                          {audit.upliftPct != null ? (
                            <span
                              className={
                                audit.upliftPct >= 0
                                  ? 'text-emerald-300'
                                  : 'text-amber-300'
                              }
                            >
                              {formatPct(audit.upliftPct)}
                            </span>
                          ) : (
                            <span className="text-slate-500">n/a</span>
                          )}
                        </td>
                        <td className="px-2 py-1 align-top text-xs text-slate-300">
                          {audit.recommendations ||
                            audit.underpricingIssues ||
                            audit.competitorSummary ||
                            ''}
                        </td>
                        <td className="px-2 py-1 align-top text-[11px] text-slate-400 whitespace-nowrap">
                          {audit.createdAt
                            ? new Date(audit.createdAt).toLocaleDateString(
                                'en-US',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                },
                              )
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {emailPreview.open && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                  <h2 className="text-sm font-semibold text-slate-100">
                    Audit email preview
                  </h2>
                  <button
                    type="button"
                    onClick={onClosePreview}
                    className="text-xs text-slate-400 hover:text-slate-100"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="max-h-[70vh] space-y-3 overflow-auto px-4 py-3 text-xs">
                  {emailPreview.loading && (
                    <div className="rounded-md bg-slate-800 px-3 py-2 text-xs text-slate-100">
                      Generating preview…
                    </div>
                  )}

                  {emailPreview.error && (
                    <div className="rounded-md bg-red-900/40 px-3 py-2 text-xs text-red-200">
                      {emailPreview.error}
                    </div>
                  )}

                  {!emailPreview.loading && !emailPreview.error && (
                    <>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-medium text-slate-300">
                            Subject
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard('Subject', emailPreview.subject)
                            }
                            className="rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-700"
                          >
                            Copy subject
                          </button>
                        </div>
                        <input
                          type="text"
                          readOnly
                          value={emailPreview.subject}
                          className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-medium text-slate-300">
                            HTML body
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard('HTML body', emailPreview.html)
                            }
                            className="rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-700"
                          >
                            Copy HTML
                          </button>
                        </div>
                        <textarea
                          readOnly
                          value={emailPreview.html}
                          className="h-40 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-medium text-slate-300">
                            Plain text body
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard('Text body', emailPreview.text)
                            }
                            className="rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-700"
                          >
                            Copy text
                          </button>
                        </div>
                        <textarea
                          readOnly
                          value={emailPreview.text}
                          className="h-40 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100"
                        />
                      </div>
                    </>
                  )}
                </div>

                {copyStatus && (
                  <div className="border-t border-slate-800 bg-slate-900 px-4 py-2 text-[11px] text-slate-300">
                    {copyStatus}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

// pages/admin/referrals.tsx
/* eslint-disable no-console */
import { useEffect, useState } from 'react'
import Head from 'next/head'

type ReferralAdmin = {
  id: string
  clientName: string
  clientEmail: string
  realtorName: string
  realtorEmail: string
  source?: string | null
  onboardingStatus?: string | null
  payoutEligible?: boolean | null
  payoutSent?: boolean | null
  payoutMethod?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

type EditableReferral = ReferralAdmin & {
  _dirty?: boolean
  _saving?: boolean
  _error?: string | null
}

const debugClient =
  typeof window !== 'undefined' &&
  (process.env.NEXT_PUBLIC_DEBUG_REFERRALS === '1' ||
    process.env.NEXT_PUBLIC_DEBUG_ONBOARDING === '1')

const logClient = (msg: string, data?: unknown) => {
  if (debugClient) {
    console.log(`[admin/referrals] ${msg}`, data ?? '')
  }
}

const logClientError = (msg: string, data?: unknown) => {
  console.error(`[admin/referrals] ${msg}`, data ?? '')
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

function statusMeta(status?: string | null) {
  const s = (status || '').toUpperCase()
  switch (s) {
    case 'INVITED':
      return { label: 'Invited', progress: 10 }
    case 'STARTED':
      return { label: 'In progress', progress: 25 }
    case 'ONBOARDING_SUBMITTED':
    case 'SUBMITTED':
      return { label: 'Onboarding submitted', progress: 50 }
    case 'COMPLETED':
      return { label: 'Completed', progress: 100 }
    default:
      return { label: 'Created', progress: 10 }
  }
}

const statusOptions = ['INVITED', 'STARTED', 'ONBOARDING_SUBMITTED', 'SUBMITTED', 'COMPLETED']

export default function AdminReferralsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [referrals, setReferrals] = useState<EditableReferral[]>([])

  // Initial load
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        logClient('fetching admin list from /api/referrals/admin-list')

        const resp = await fetch('/api/referrals/admin-list?limit=250')
        let body: any = {}
        try {
          body = await resp.json()
        } catch {
          body = {}
        }

        if (!resp.ok) {
          logClientError('list error from admin-list', {
            status: resp.status,
            body,
          })
          throw new Error(body.error || 'Failed to load referrals')
        }

        const list: ReferralAdmin[] = body.referrals || []
        logClient('loaded referrals', {
          count: list.length,
          sample: list.slice(0, 3).map((r) => ({
            id: r.id,
            status: r.onboardingStatus,
          })),
        })

        // Sort by createdAt desc if available
        list.sort((a, b) => {
          const da = a.createdAt ? Date.parse(a.createdAt) : 0
          const db = b.createdAt ? Date.parse(b.createdAt) : 0
          return db - da
        })

        setReferrals(list.map((r) => ({ ...r })))
      } catch (err: any) {
        logClientError('unexpected error loading referrals', err)
        setError(err?.message || 'Failed to load referrals')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const markDirty = (id: string, patch: Partial<EditableReferral>) => {
    setReferrals((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              ...patch,
              _dirty: true,
              _error: null,
            }
          : r
      )
    )
  }

  const saveReferral = async (ref: EditableReferral) => {
    const payload = {
      id: ref.id,
      onboardingStatus: ref.onboardingStatus || null,
      payoutEligible: !!ref.payoutEligible,
      payoutSent: !!ref.payoutSent,
      payoutMethod: ref.payoutMethod || null,
    }

    try {
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === ref.id ? { ...r, _saving: true, _error: null } : r
        )
      )

      logClient('saving referral via /api/admin/referrals/update', payload)

      const resp = await fetch('/api/admin/referrals/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      let body: any = {}
      try {
        body = await resp.json()
      } catch {
        body = {}
      }

      if (!resp.ok) {
        logClientError('update error', { status: resp.status, body })
        throw new Error(body.error || 'Failed to update referral')
      }

      const updated = body.referral as ReferralAdmin

      logClient('update success', { id: ref.id, updatedStatus: updated.onboardingStatus })

      setReferrals((prev) =>
        prev.map((r) =>
          r.id === ref.id
            ? {
                ...r,
                ...updated,
                _dirty: false,
                _saving: false,
                _error: null,
              }
            : r
        )
      )
    } catch (err: any) {
      logClientError('update unexpected error', err)
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === ref.id
            ? { ...r, _saving: false, _error: err?.message || 'Save failed' }
            : r
        )
      )
    }
  }

  return (
    <>
      <Head>
        <title>Latimere Admin – Referrals</title>
      </Head>

      <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold">
                Referral Admin
              </h1>
              <p className="text-sm text-slate-400">
                View all referrals, track onboarding progress, and manage
                referral payouts.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              <div>Env: {process.env.NODE_ENV}</div>
            </div>
          </header>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {loading && (
              <div className="px-6 py-4 text-sm text-slate-300">
                Loading referrals…
              </div>
            )}

            {!loading && error && (
              <div className="px-6 py-4 text-sm text-red-400">{error}</div>
            )}

            {!loading && !error && referrals.length === 0 && (
              <div className="px-6 py-4 text-sm text-slate-300">
                No referrals found yet.
              </div>
            )}

            {!loading && !error && referrals.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800">
                    <tr className="text-left uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-2">Client</th>
                      <th className="px-4 py-2">Realtor</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Payout</th>
                      <th className="px-4 py-2">Method</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {referrals.map((r, idx) => {
                      const meta = statusMeta(r.onboardingStatus)
                      return (
                        <tr
                          key={r.id}
                          className={
                            idx % 2 === 0
                              ? 'bg-slate-950/40'
                              : 'bg-slate-900/40'
                          }
                        >
                          <td className="px-4 py-3 align-top">
                            <div className="font-medium text-slate-50">
                              {r.clientName || 'Unnamed client'}
                            </div>
                            <div className="text-slate-400">
                              {r.clientEmail || '—'}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              Created:{' '}
                              {r.createdAt ? formatDate(r.createdAt) : '—'}
                            </div>
                          </td>

                          <td className="px-4 py-3 align-top">
                            <div className="font-medium text-slate-200">
                              {r.realtorName || 'Unknown realtor'}
                            </div>
                            <div className="text-slate-400">
                              {r.realtorEmail || '—'}
                            </div>
                            {r.source && (
                              <div className="text-[11px] text-slate-500 mt-1">
                                Source: {r.source}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 align-top">
                            <div className="space-y-2">
                              <select
                                value={r.onboardingStatus || ''}
                                onChange={(e) =>
                                  markDirty(r.id, {
                                    onboardingStatus: e.target.value || null
                                  })
                                }
                                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-[11px] text-slate-50 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                              >
                                <option value="">(unset)</option>
                                {statusOptions.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>

                              {/* Progress bar */}
                              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-cyan-500"
                                  style={{ width: `${meta.progress}%` }}
                                />
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {meta.label} · {meta.progress}% complete
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-1 text-[11px]">
                              <label className="inline-flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={!!r.payoutEligible}
                                  onChange={(e) =>
                                    markDirty(r.id, {
                                      payoutEligible: e.target.checked
                                    })
                                  }
                                />
                                <span>Eligible</span>
                              </label>
                              <label className="inline-flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={!!r.payoutSent}
                                  onChange={(e) =>
                                    markDirty(r.id, {
                                      payoutSent: e.target.checked
                                    })
                                  }
                                />
                                <span>Paid</span>
                              </label>
                            </div>
                          </td>

                          <td className="px-4 py-3 align-top">
                            <input
                              type="text"
                              value={r.payoutMethod || ''}
                              onChange={(e) =>
                                markDirty(r.id, {
                                  payoutMethod: e.target.value
                                })
                              }
                              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-[11px] text-slate-50 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                              placeholder="Venmo @handle, CashApp, etc."
                            />
                          </td>

                          <td className="px-4 py-3 align-top text-right">
                            <div className="flex flex-col items-end gap-1">
                              <button
                                type="button"
                                disabled={!r._dirty || r._saving}
                                onClick={() => saveReferral(r)}
                                className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1 text-[11px] font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {r._saving
                                  ? 'Saving…'
                                  : r._dirty
                                  ? 'Save'
                                  : 'Saved'}
                              </button>
                              {r._error && (
                                <span className="text-[11px] text-red-400">
                                  {r._error}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => logClient('row debug', r)}
                                className="text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-2"
                              >
                                Log row
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

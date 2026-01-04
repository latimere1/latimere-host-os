// pages/refer/status.tsx
/* eslint-disable no-console */
import { FormEvent, useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

/* -------------------------------------------------------------------------- */
/* Types & helpers                                                            */
/* -------------------------------------------------------------------------- */

type ReferralSummary = {
  id: string
  clientName: string
  clientEmail: string
  realtorName: string
  realtorEmail: string
  onboardingStatus?: string | null
  payoutEligible?: boolean | null
  payoutSent?: boolean | null
  payoutMethod?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

type StatusMeta = {
  label: string
  progress: number
  step: number
  steps: number
  description: string
}

/* -------------------------------------------------------------------------- */
/* Client logging                                                             */
/* -------------------------------------------------------------------------- */

const debugClient =
  typeof window !== 'undefined' &&
  (process.env.NEXT_PUBLIC_DEBUG_REFERRALS === '1' ||
    process.env.NEXT_PUBLIC_DEBUG_ONBOARDING === '1')

const logClient = (msg: string, data?: unknown) => {
  if (debugClient) {
    console.log(`[refer/status] ${msg}`, data ?? '')
  }
}

const logClientError = (msg: string, data?: unknown) => {
  console.error(`[refer/status] ${msg}`, data ?? '')
}

/* -------------------------------------------------------------------------- */
/* Status mapping                                                             */
/* -------------------------------------------------------------------------- */

const TOTAL_STEPS = 4

function statusMeta(r: ReferralSummary): StatusMeta {
  const raw = (r.onboardingStatus || '').toUpperCase()

  if (debugClient) {
    logClient('mapping status meta', {
      id: r.id,
      rawStatus: r.onboardingStatus,
    })
  }

  switch (raw) {
    case 'INVITED':
      return {
        label: 'Invite sent',
        progress: 10,
        step: 1,
        steps: TOTAL_STEPS,
        description: 'We’ve invited your client to start onboarding.',
      }

    case 'STARTED':
      return {
        label: 'In progress',
        progress: 25,
        step: 2,
        steps: TOTAL_STEPS,
        description:
          'Your client has opened their onboarding link and is reviewing details.',
      }

    case 'ONBOARDING_SUBMITTED':
    case 'SUBMITTED':
      return {
        label: 'Initial details submitted',
        progress: 50,
        step: 3,
        steps: TOTAL_STEPS,
        description:
          'Your client has shared initial property details. We’re reviewing them now.',
      }

    case 'DETAILS_PROVIDED':
      return {
        label: 'Details provided',
        progress: 75,
        step: 3,
        steps: TOTAL_STEPS,
        description:
          'We have the information we need from your client. Next up is final onboarding and go-live.',
      }

    case 'COMPLETED':
      return {
        label: 'Fully onboarded',
        progress: 100,
        step: 4,
        steps: TOTAL_STEPS,
        description:
          'Your client is fully onboarded. Go-live timing and payouts are being coordinated.',
      }

    default:
      return {
        label: 'Invite created',
        progress: 10,
        step: 1,
        steps: TOTAL_STEPS,
        description:
          'We’ve created the referral. If you don’t see progress soon, Taylor will reach out.',
      }
  }
}

function payoutLabel(r: ReferralSummary) {
  if (r.payoutSent) return 'Paid'
  if (r.payoutEligible) return 'Eligible (pending first payout)'
  return 'Not yet eligible'
}

function formatDate(value?: string | null): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/* -------------------------------------------------------------------------- */
/* Page component                                                             */
/* -------------------------------------------------------------------------- */

export default function RealtorStatusPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [referrals, setReferrals] = useState<ReferralSummary[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  // Log initial client-side config
  useEffect(() => {
    if (!debugClient) return
    logClient('mounted refer/status page', {
      NEXT_PUBLIC_DEBUG_REFERRALS: process.env.NEXT_PUBLIC_DEBUG_REFERRALS,
      NEXT_PUBLIC_DEBUG_ONBOARDING: process.env.NEXT_PUBLIC_DEBUG_ONBOARDING,
    })
  }, [])

  const loadForEmail = useCallback(
    async (rawEmail: string) => {
      const trimmed = rawEmail.trim().toLowerCase()
      if (!trimmed) {
        setError('Please enter the email you used when submitting referrals.')
        return
      }

      try {
        setLoading(true)
        setError(null)
        setHasSearched(true)

        logClient('fetching referrals for realtor', { email: trimmed })

        const url = `/api/referrals/by-realtor?email=${encodeURIComponent(
          trimmed
        )}`

        const resp = await fetch(url)

        let body: any = {}
        try {
          body = await resp.json()
        } catch (jsonErr: any) {
          logClientError('failed to parse JSON from /api/referrals/by-realtor', {
            message: jsonErr?.message,
          })
          body = {}
        }

        if (!resp.ok) {
          logClientError('API error from /api/referrals/by-realtor', {
            status: resp.status,
            body,
          })
          throw new Error(body.error || 'Failed to load your referrals')
        }

        const list: ReferralSummary[] = body.referrals || []
        logClient('loaded referrals', {
          count: list.length,
          firstStatuses: list.slice(0, 5).map((r) => ({
            id: r.id,
            status: r.onboardingStatus,
            payoutEligible: r.payoutEligible,
            payoutSent: r.payoutSent,
          })),
        })

        setReferrals(list)
      } catch (err: any) {
        logClientError('unexpected error loading referrals', {
          message: err?.message,
          stack: err?.stack,
        })
        setError(err?.message || 'Something went wrong loading your referrals.')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Handle manual form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await loadForEmail(email)
  }

  // Magic-link behavior: if ?email= is present, preload and auto-load once
  useEffect(() => {
    if (!router.isReady) return

    const q = router.query.email
    if (typeof q === 'string' && q.trim()) {
      setEmail(q)
      if (!hasSearched) {
        logClient('auto-loading referrals for email from query', { email: q })
        loadForEmail(q)
      }
    }
  }, [router.isReady, router.query.email, hasSearched, loadForEmail])

  return (
    <>
      <Head>
        <title>Latimere Referral Status</title>
      </Head>

      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4 py-10">
        <div className="max-w-3xl w-full space-y-8">
          {/* Search card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-8 py-10 shadow-xl">
            <h1 className="text-2xl md:text-3xl font-semibold mb-4">
              Check your referral status
            </h1>
            <p className="text-slate-300 text-sm mb-4">
              Enter the email address you use for referrals and we&apos;ll show
              you how each of your clients is progressing through onboarding. If
              you arrived here from a link in your email, we&apos;ve already
              filled this in for you.
            </p>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col md:flex-row gap-3 mt-4"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="you@yourrealty.com"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center items-center rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading…' : 'View status'}
              </button>
            </form>

            {error && (
              <p className="mt-3 text-sm text-red-400">
                {error}
              </p>
            )}

            {debugClient && (
              <p className="mt-3 text-[11px] text-slate-500">
                Debug mode enabled – client-side logs available in your browser
                console.
              </p>
            )}
          </div>

          {/* Results */}
          {hasSearched && !loading && !error && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-8 py-8 shadow-xl">
              {referrals.length === 0 ? (
                <p className="text-sm text-slate-300">
                  We didn&apos;t find any referrals for that email yet. If you
                  think this is a mistake, reach out to Taylor directly.
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">
                      Your referrals
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      We only show high-level progress here, not private host
                      details.
                    </p>
                  </div>

                  <div className="divide-y divide-slate-800">
                    {referrals.map((r) => {
                      const meta = statusMeta(r)
                      const created = formatDate(r.createdAt)
                      const updated = formatDate(r.updatedAt)

                      return (
                        <div
                          key={r.id}
                          className="py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-50">
                              {r.clientName || 'Referred client'}
                            </p>
                            <p className="text-xs text-slate-400">
                              Status: {meta.label} · Step {meta.step} of{' '}
                              {meta.steps}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {meta.description}
                            </p>

                            {(created || updated || r.onboardingStatus) && (
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {created && (
                                  <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                                    Created {created}
                                  </span>
                                )}
                                {updated && (
                                  <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                                    Updated {updated}
                                  </span>
                                )}
                                {r.onboardingStatus && debugClient && (
                                  <span className="inline-flex items-center rounded-full bg-cyan-500/10 border border-cyan-500/40 px-2 py-0.5 text-[10px] text-cyan-300">
                                    Raw status: {r.onboardingStatus}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="w-full md:w-56 space-y-2">
                            {/* Progress bar */}
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-cyan-500 transition-all"
                                style={{ width: `${meta.progress}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>{meta.progress}% complete</span>
                              <span>Bonus: {payoutLabel(r)}</span>
                            </div>
                            {r.payoutMethod && (
                              <p className="text-[11px] text-slate-500 text-right">
                                Payout via {r.payoutMethod}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

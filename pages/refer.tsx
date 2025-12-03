// pages/refer.tsx
/* eslint-disable no-console */
import { FormEvent, useMemo, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

/**
 * Feature flag for referrals.
 * Note: this was previously unused; we keep the logic but only log with it
 * so we don't unexpectedly disable the page in prod.
 */
const enableReferrals =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_ENABLE_REFERRALS === '1'
    : (window as any).NEXT_PUBLIC_ENABLE_REFERRALS === '1'

// Lightweight client debug flag
const debugClient =
  typeof window !== 'undefined' &&
  (process.env.NEXT_PUBLIC_DEBUG_REFERRALS === '1' ||
    process.env.NEXT_PUBLIC_DEBUG_ONBOARDING === '1')

function logClient(msg: string, data?: unknown) {
  if (debugClient) {
    console.log(`[refer] ${msg}`, data ?? '')
  }
}

function logClientError(msg: string, data?: unknown) {
  console.error(`[refer] ${msg}`, data ?? '')
}

export default function ReferPage() {
  const router = useRouter()

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Resolve referralCode from the URL query params.
   * Supports:
   *   /refer?code=DUSTAN01
   *   /refer?ref=DUSTAN01
   */
  const referralCode = useMemo(() => {
    const raw =
      (router.query.code as string | undefined) ||
      (router.query.ref as string | undefined) ||
      ''

    if (!raw) {
      logClient('No referralCode present in query')
      return ''
    }

    const trimmed = raw.trim()
    if (!trimmed) {
      logClient('ReferralCode present but empty after trim', { raw })
      return ''
    }

    // Convention: uppercase codes for display; backend will normalize again anyway
    const normalized = trimmed.toUpperCase()

    logClient('Resolved referralCode from query', {
      raw,
      normalized,
      query: router.query,
    })

    return normalized
  }, [router.query])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const submitId = Math.random().toString(36).slice(2, 8)

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    const payload = {
      realtorName: String(formData.get('realtorName') || '').trim(),
      realtorEmail: String(formData.get('realtorEmail') || '').trim(),
      clientName: String(formData.get('clientName') || '').trim(),
      clientEmail: String(formData.get('clientEmail') || '').trim(),
      notes: String(formData.get('notes') || '').trim() || undefined,
      // Explicitly tag source; backend also defaults to "realtor" if omitted
      source: 'realtor',
      // Pass referralCode through to API; empty string will be ignored server-side
      referralCode: referralCode || undefined,
    }

    logClient('Submitting referral form', {
      submitId,
      hasReferralCode: !!referralCode,
      enableReferrals,
      payloadPreview: {
        realtorName: payload.realtorName,
        realtorEmail: payload.realtorEmail,
        clientName: payload.clientName,
        clientEmail: payload.clientEmail,
        source: payload.source,
        referralCode: payload.referralCode,
      },
    })

    try {
      const resp = await fetch('/api/referrals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        logClientError('Non-OK response from /api/referrals/create', {
          submitId,
          status: resp.status,
          body,
        })
        throw new Error(body.error || 'Failed to create referral')
      }

      const body = await resp.json().catch(() => ({} as any))
      logClient('Referral created successfully', {
        submitId,
        referralId: body?.referral?.id,
        onboardingUrl: body?.onboardingUrl,
        mode: body?.mode,
      })

      setSuccess(
        "Thank you! We've sent your client an email with their onboarding link and CC’d you for reference."
      )
      form.reset()
    } catch (err: any) {
      logClientError('Submit error', {
        submitId,
        message: err?.message,
        stack: err?.stack,
      })
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>Refer a Host | Latimere Hosting</title>
      </Head>
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-xl border border-slate-800 rounded-2xl p-6 md:p-8 bg-slate-900/70 shadow-xl">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">
            Refer a Host to Latimere
          </h1>
          <p className="text-sm text-slate-300 mb-4">
            Share a potential host in under 60 seconds. We’ll send them a branded onboarding
            link and keep you in the loop every step of the way.
          </p>

          {/* Show referral code banner if one is applied via URL */}
          {referralCode && (
            <div className="mb-4 text-xs text-cyan-200 bg-cyan-950/40 border border-cyan-700/60 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
              <span>
                Referral code applied:{' '}
                <span className="font-mono font-semibold text-cyan-100">
                  {referralCode}
                </span>
              </span>
              {debugClient && (
                <span className="text-[10px] text-cyan-300">
                  (tracked via /api/referrals/create)
                </span>
              )}
            </div>
          )}

          {!enableReferrals && (
            <p className="mb-4 text-[11px] text-amber-300 bg-amber-950/30 border border-amber-800/70 rounded-lg px-3 py-2">
              Referrals feature flag is currently disabled in this environment. Submissions may
              be ignored depending on backend configuration.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="realtorName">
                Your name
              </label>
              <input
                id="realtorName"
                name="realtorName"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="realtorEmail">
                Your email
              </label>
              <input
                id="realtorEmail"
                name="realtorEmail"
                type="email"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-cyan-500"
              />
            </div>

            <hr className="border-slate-800 my-2" />

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="clientName">
                Client name
              </label>
              <input
                id="clientName"
                name="clientName"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="clientEmail">
                Client email
              </label>
              <input
                id="clientEmail"
                name="clientEmail"
                type="email"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="notes">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-cyan-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-emerald-300 bg-emerald-950/30 border border-emerald-800 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:hover:bg-cyan-500 text-slate-950 font-semibold py-2.5 text-sm mt-2"
            >
              {submitting ? 'Sending referral…' : 'Send referral'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}

// pages/onboarding/[token].tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

type Referral = {
  id: string
  realtorName: string
  realtorEmail: string
  clientName: string
  clientEmail: string
  source?: string | null
  onboardingStatus: string
  lastEmailSentAt?: string | null
  lastEmailStatus?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export default function OnboardingTokenPage() {
  const router = useRouter()
  const { token } = router.query

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [referral, setReferral] = useState<Referral | null>(null)

  useEffect(() => {
    if (!token) return

    let cancelled = false

    async function fetchReferral() {
      try {
        setLoading(true)
        setError(null)

        const resp = await fetch(`/api/referrals/by-token?token=${encodeURIComponent(String(token))}`)
        const data = await resp.json()

        if (!resp.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load your onboarding link.')
        }

        if (!cancelled) {
          setReferral(data.referral as Referral)
        }

        // Basic client-side log for debugging
        // (server-side logs are in /api/referrals/by-token)
        // eslint-disable-next-line no-console
        console.log('[onboarding] loaded referral', data.referral)
      } catch (err: any) {
        console.error('[onboarding] failed to load referral', err)
        if (!cancelled) {
          setError(err.message || 'Something went wrong loading your onboarding.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchReferral()

    return () => {
      cancelled = true
    }
  }, [token])

  const title = referral
    ? `Welcome, ${referral.clientName} | Latimere Onboarding`
    : 'Latimere Onboarding'

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
        <div className="max-w-xl w-full border border-slate-800 rounded-2xl p-6 md:p-8 bg-slate-900/70 shadow-xl">
          {loading && (
            <>
              <div className="h-4 w-24 bg-slate-800 rounded mb-3 animate-pulse" />
              <div className="h-3 w-64 bg-slate-800 rounded mb-2 animate-pulse" />
              <div className="h-3 w-52 bg-slate-800 rounded mb-6 animate-pulse" />
              <div className="h-10 w-full bg-slate-800 rounded-xl animate-pulse" />
            </>
          )}

          {!loading && error && (
            <>
              <h1 className="text-2xl md:text-3xl font-semibold mb-3">
                Onboarding link problem
              </h1>
              <p className="text-sm text-red-300 mb-4">
                {error}
              </p>
              <p className="text-sm text-slate-300">
                Please reach out to Taylor at <span className="font-mono">taylor@latimere.com</span>{' '}
                or your realtor so we can get you a fresh link.
              </p>
            </>
          )}

          {!loading && !error && referral && (
            <>
              <h1 className="text-2xl md:text-3xl font-semibold mb-2">
                Welcome to Latimere Hosting, {referral.clientName.split(' ')[0]}.
              </h1>
              <p className="text-sm text-slate-300 mb-3">
                You were referred by{' '}
                <span className="font-semibold">{referral.realtorName}</span>
                {referral.source ? (
                  <> via <span className="italic">{referral.source}</span>.</>
                ) : (
                  <>.</>
                )}
              </p>
              <p className="text-sm text-slate-300 mb-6">
                We specialize in high-performance short-term rental management in the Smoky Mountains.
                This onboarding will gather just the essentials we need to evaluate your property and, if
                it’s a fit, get you live as quickly as possible.
              </p>

              {/* Placeholder for real onboarding wizard */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-200">Current status</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs uppercase tracking-wide">
                    {referral.onboardingStatus}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  We’re still wiring up the full onboarding wizard. For now, Taylor will connect with you
                  directly to walk through property details, pricing, and next steps.
                </div>
              </div>

              <button
                type="button"
                className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-2.5 text-sm"
                onClick={() => {
                  window.location.href = 'mailto:taylor@latimere.com?subject=Latimere Onboarding'
                }}
              >
                Email Taylor to continue
              </button>
            </>
          )}
        </div>
      </main>
    </>
  )
}

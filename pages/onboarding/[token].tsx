// pages/onboarding/[token].tsx
import { useEffect, useState, FormEvent } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

type Referral = {
  id: string
  clientName: string
  clientEmail: string
  realtorName: string
  source?: string | null
  onboardingStatus?: string | null
}

const debugClient =
  typeof window !== 'undefined' &&
  (process.env.NEXT_PUBLIC_DEBUG_ONBOARDING === '1' ||
    process.env.NEXT_PUBLIC_DEBUG_REFERRALS === '1')

export default function OnboardingPage() {
  const router = useRouter()
  const { token } = router.query

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [referral, setReferral] = useState<Referral | null>(null)

  const [phone, setPhone] = useState('')
  const [propertyAddress, setPropertyAddress] = useState('')
  const [sleeps, setSleeps] = useState('')
  const [listedStatus, setListedStatus] = useState('')
  const [timeline, setTimeline] = useState('')
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Derived display values
  const clientName = referral?.clientName || 'there'
  const realtorName = referral?.realtorName || 'your realtor'
  const sourceLabel = referral?.source || 'realtor'
  const backendStatus = referral?.onboardingStatus || 'INVITED'

  const alreadySubmitted =
    submitted ||
    backendStatus === 'SUBMITTED' ||
    backendStatus === 'COMPLETED' ||
    backendStatus === 'ONBOARDING_SUBMITTED'

  // Load referral details from the token
  useEffect(() => {
    if (!router.isReady) return
    if (!token || typeof token !== 'string') {
      if (debugClient) {
        // eslint-disable-next-line no-console
        console.log('[onboarding] missing or invalid token', { token })
      }
      setLoading(false)
      setError(
        'This onboarding link appears to be invalid. Please contact Taylor to request a new invite.'
      )
      return
    }

    const loadReferral = async () => {
      const startedAt = Date.now()
      try {
        setLoading(true)
        setError(null)

        if (debugClient) {
          // eslint-disable-next-line no-console
          console.log('[onboarding] fetching referral by token', { token })
        }

        const resp = await fetch(
          `/api/referrals/by-token?token=${encodeURIComponent(token)}`
        )

        if (!resp.ok) {
          let body: any = {}
          try {
            body = await resp.json()
          } catch {
            body = {}
          }

          if (debugClient) {
            // eslint-disable-next-line no-console
            console.log('[onboarding] non-OK response from by-token', {
              status: resp.status,
              body,
            })
          }

          throw new Error(body.error || 'Failed to load referral')
        }

        const data = await resp.json()

        if (debugClient) {
          // eslint-disable-next-line no-console
          console.log('[onboarding] loaded referral payload', {
            latencyMs: Date.now() - startedAt,
            data,
          })
        }

        if (!data?.referral?.id) {
          throw new Error('Invite not found for this link.')
        }

        setReferral(data.referral)
      } catch (err: any) {
        console.error('[onboarding] load error', err)
        setError(err?.message || 'Failed to load invite')
      } finally {
        setLoading(false)
      }
    }

    loadReferral()
  }, [router.isReady, token])

  const validateForm = (): string | null => {
    if (!phone.trim()) return 'Please enter the best phone number to reach you.'
    if (!propertyAddress.trim())
      return 'Please enter the property address (or best current description).'
    if (!sleeps.trim()) return 'Please enter how many guests the property sleeps.'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!referral || typeof token !== 'string') {
      setError(
        'Your invite details are missing. Please refresh the page or contact Taylor for help.'
      )
      if (debugClient) {
        // eslint-disable-next-line no-console
        console.log('[onboarding] submit blocked – missing referral or token', {
          hasReferral: !!referral,
          token,
        })
      }
      return
    }

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      if (debugClient) {
        // eslint-disable-next-line no-console
        console.log('[onboarding] validation failed', { validationError })
      }
      return
    }

    const payload = {
      referralId: referral.id,
      inviteToken: token,
      phone,
      propertyAddress,
      sleeps,
      listedStatus,
      timeline,
      notes,
    }

    const startedAt = Date.now()

    try {
      setSubmitting(true)
      setError(null)

      if (debugClient) {
        // eslint-disable-next-line no-console
        console.log('[onboarding] submitting referral completion', payload)
      }

      const resp = await fetch('/api/referrals/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!resp.ok) {
        let body: any = {}
        try {
          body = await resp.json()
        } catch {
          body = {}
        }

        console.error('[onboarding] /api/referrals/complete non-OK', {
          status: resp.status,
          body,
        })

        throw new Error(body.error || 'Failed to submit onboarding')
      }

      if (debugClient) {
        // eslint-disable-next-line no-console
        console.log('[onboarding] submit success', {
          latencyMs: Date.now() - startedAt,
        })
      }

      setSubmitted(true)
    } catch (err: any) {
      console.error('[onboarding] submit error', err)
      setError(err?.message || 'Something went wrong submitting your details.')
    } finally {
      setSubmitting(false)
    }
  }

  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'taylor@latimere.com'

  return (
    <>
      <Head>
        <title>Latimere Onboarding</title>
      </Head>

      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4 py-10">
        <div className="max-w-3xl w-full space-y-8">
          {/* Welcome card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-8 py-10 shadow-xl">
            {loading && (
              <p className="text-slate-400 text-sm">Loading your invite…</p>
            )}

            {!loading && error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            {!loading && !error && referral && (
              <>
                <h1 className="text-2xl md:text-3xl font-semibold mb-4">
                  Welcome to Latimere Hosting, {clientName}.
                </h1>
                <p className="text-slate-300 mb-2">
                  You were referred by{' '}
                  <span className="font-medium">{realtorName}</span> via{' '}
                  <span className="italic">{sourceLabel}</span>.
                </p>
                <p className="text-slate-400 mb-4 text-sm leading-relaxed">
                  We specialize in high-performance short-term rental management
                  in the Smoky Mountains. This onboarding gathers just the
                  essentials we need to evaluate your property and, if it&apos;s
                  a fit, get you live as quickly as possible.
                </p>

                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    Current status
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-600 px-3 py-0.5 text-xs font-medium text-slate-100">
                    {alreadySubmitted ? 'SUBMITTED' : backendStatus}
                  </span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-2">
                  We&apos;re still wiring up the full onboarding wizard. For
                  now, share a few details below and Taylor will connect with
                  you directly to walk through property details, pricing, and
                  next steps.
                </p>
              </>
            )}
          </div>

          {/* Onboarding form */}
          {!loading && !error && referral && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-8 py-8 shadow-xl">
              {alreadySubmitted ? (
                <div className="text-sm text-emerald-300 space-y-2">
                  <p>
                    Thank you! We&apos;ve received your details. Taylor will
                    follow up shortly to review your property and next steps.
                  </p>
                  <p className="text-xs text-emerald-200/80">
                    If you need to update anything, just reply to the email you
                    received or contact us at {contactEmail}.
                  </p>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1">
                        Best phone number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1">
                        Sleeps
                      </label>
                      <input
                        type="number"
                        value={sleeps}
                        onChange={(e) => setSleeps(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="10"
                        min={1}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">
                      Property address
                    </label>
                    <input
                      type="text"
                      value={propertyAddress}
                      onChange={(e) => setPropertyAddress(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="123 Main St, City, ST"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1">
                        Previously listed as STR?
                      </label>
                      <select
                        value={listedStatus}
                        onChange={(e) => setListedStatus(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      >
                        <option value="">Select</option>
                        <option value="never">Never rented before</option>
                        <option value="occasionally">
                          Occasionally listed / self-managed
                        </option>
                        <option value="fulltime">
                          Full-time STR with another manager
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-1">
                        When are you hoping to start?
                      </label>
                      <input
                        type="text"
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="e.g., Within 30 days, This winter, etc."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">
                      Anything else we should know?
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="Share anything about your goals, concerns, or property details."
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-400">{error}</p>
                  )}

                  <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex justify-center items-center rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Sending…' : 'Send details to Taylor'}
                    </button>

                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4"
                    >
                      Prefer to email instead? Click here to email Taylor
                      directly.
                    </a>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

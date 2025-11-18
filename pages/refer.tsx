// pages/refer.tsx
import { FormEvent, useState } from 'react'
import Head from 'next/head'

const enableReferrals =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_ENABLE_REFERRALS === '1'
    : (window as any).NEXT_PUBLIC_ENABLE_REFERRALS === '1' // safety; mostly for SSR

export default function ReferPage() {
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
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
    }

    try {
      const resp = await fetch('/api/referrals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to create referral')
      }

      setSuccess(
        "Thank you! We've sent your client an email with their onboarding link and CC’d you for reference."
      )
      form.reset()
    } catch (err: any) {
      console.error('[refer] submit error', err)
      setError(err.message || 'Something went wrong. Please try again.')
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
          <p className="text-sm text-slate-300 mb-6">
            Share a potential host in under 60 seconds. We’ll send them a branded onboarding
            link and keep you in the loop every step of the way.
          </p>

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

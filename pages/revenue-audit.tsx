// pages/revenue-audit.tsx
/* eslint-disable no-console */
import Head from 'next/head'
import { FormEvent, useState } from 'react'

type AuditFormState = {
  name: string
  email: string
  phone: string
  market: string
  listingUrl: string
  bedrooms: string
  sleeps: string
  currentNightlyRate: string
  currentOccupancy: string
  notes: string
}

const initialFormState: AuditFormState = {
  name: '',
  email: '',
  phone: '',
  market: '',
  listingUrl: '',
  bedrooms: '',
  sleeps: '',
  currentNightlyRate: '',
  currentOccupancy: '',
  notes: '',
}

export default function RevenueAuditPage() {
  const [form, setForm] = useState<AuditFormState>(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  function updateField<K extends keyof AuditFormState>(
    key: K,
    value: AuditFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)

    if (!form.name.trim() || !form.email.trim() || !form.listingUrl.trim()) {
      setSubmitError('Name, email, and listing URL are required.')
      return
    }

    setSubmitting(true)
    console.log('[RevenueAudit] Submitting audit intake form:', form)

    try {
      const response = await fetch('/api/revenue-audit/create', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        const text = await response.text()
        console.error(
          '[RevenueAudit] HTTP error from API:',
          response.status,
          response.statusText,
          text
        )
        setSubmitError(
          'Something went wrong while submitting your request. Please try again or contact us directly.'
        )
        return
      }

      const json = (await response.json()) as {
        ok: boolean
        id?: string
        error?: string
      }

      if (!json.ok) {
        console.error('[RevenueAudit] API error payload:', json)
        setSubmitError(
          json.error ||
            'We were unable to save your request. Please try again or contact us.'
        )
        return
      }

      console.log('[RevenueAudit] Audit created with id:', json.id)
      setSubmitSuccess(true)
      setForm(initialFormState)
    } catch (err) {
      console.error('[RevenueAudit] Unexpected error:', err)
      setSubmitError(
        'Unexpected error while submitting your request. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>Free Revenue Audit — Latimere</title>
      </Head>
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10">
          {/* Hero */}
          <header className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
              Latimere Revenue Management
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-50">
              Free Revenue Audit for Your Airbnb / STR
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Share a few details about your property and we&apos;ll send a quick
              breakdown of how much revenue you may be leaving on the table —
              plus specific recommendations to fix it.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-slate-300">
              <li>• 10-minute review by Latimere (no obligation)</li>
              <li>• Simple comparison vs similar properties in your market</li>
              <li>• Clear next steps to increase revenue 15–30%+</li>
            </ul>
          </header>

          {/* Form container */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
            {submitSuccess && (
              <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3 text-sm text-emerald-200">
                Thank you! Your revenue audit request has been received. We&apos;ll
                review your listing and send you a custom breakdown shortly.
              </div>
            )}

            {submitError && (
              <div className="mb-4 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Contact info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Your name
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="For quick questions only"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Market / area
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                    value={form.market}
                    onChange={(e) => updateField('market', e.target.value)}
                    placeholder="e.g. Smoky Mountains, Gulf Shores, Scottsdale"
                  />
                </div>
              </div>

              {/* Listing details */}
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Airbnb / VRBO listing URL
                </label>
                <input
                  type="url"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                  value={form.listingUrl}
                  onChange={(e) => updateField('listingUrl', e.target.value)}
                  placeholder="https://airbnb.com/..."
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                    value={form.bedrooms}
                    onChange={(e) => updateField('bedrooms', e.target.value)}
                    placeholder="e.g. 3"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Sleeps
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                    value={form.sleeps}
                    onChange={(e) => updateField('sleeps', e.target.value)}
                    placeholder="e.g. 10"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Typical nightly rate
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                    value={form.currentNightlyRate}
                    onChange={(e) =>
                      updateField('currentNightlyRate', e.target.value)
                    }
                    placeholder="e.g. 265"
                    min={0}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Approx. occupancy %
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                    value={form.currentOccupancy}
                    onChange={(e) =>
                      updateField('currentOccupancy', e.target.value)
                    }
                    placeholder="e.g. 60"
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Anything else we should know?
                </label>
                <textarea
                  className="mt-1 h-24 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="e.g. We just added a hot tub / theater room, we think we’re underpriced mid-week, etc."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? 'Submitting your audit...' : 'Request my free revenue audit'}
                </button>
                <p className="mt-2 text-xs text-slate-500">
                  No spam, no obligation. We&apos;ll send you a simple breakdown and
                  you can decide if you want Latimere to manage your pricing.
                </p>
              </div>
            </form>
          </section>
        </div>
      </main>
    </>
  )
}

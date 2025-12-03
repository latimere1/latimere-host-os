// pages/admin/partners.tsx
/* eslint-disable no-console */
import { FormEvent, useState } from 'react'
import Head from 'next/head'

type Partner = {
  id: string
  name: string
  type?: string | null
  referralCode: string
  active: boolean
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
}

type CreateResponse = {
  ok?: boolean
  partner?: Partner
  link?: string
  error?: string
}

/* -------------------------------------------------------------------------- */
/* Client debug logging                                                       */
/* -------------------------------------------------------------------------- */

const debugClient =
  typeof window !== 'undefined' &&
  (process.env.NEXT_PUBLIC_DEBUG_REFERRALS === '1' ||
    process.env.NEXT_PUBLIC_DEBUG_ONBOARDING === '1')

const logClient = (msg: string, data?: unknown) => {
  if (debugClient) {
    console.log(`[admin/partners] ${msg}`, data ?? '')
  }
}

const logClientError = (msg: string, data?: unknown) => {
  console.error(`[admin/partners] ${msg}`, data ?? '')
}

/* -------------------------------------------------------------------------- */
/* Page component                                                             */
/* -------------------------------------------------------------------------- */

export default function AdminPartnersPage() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lastPartner, setLastPartner] = useState<Partner | null>(null)
  const [lastLink, setLastLink] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    const name = String(formData.get('name') || '').trim()
    const type = String(formData.get('type') || '').trim() || 'business'
    const contactName = String(formData.get('contactName') || '').trim() || undefined
    const contactEmail =
      String(formData.get('contactEmail') || '').trim() || undefined
    const contactPhone =
      String(formData.get('contactPhone') || '').trim() || undefined
    const customCode =
      String(formData.get('referralCode') || '').trim() || undefined

    const payload = {
      name,
      type,
      contactName,
      contactEmail,
      contactPhone,
      referralCode: customCode,
    }

    logClient('Submitting create partner form', {
      payloadPreview: {
        name,
        type,
        contactName,
        contactEmail,
        contactPhone,
        customCode,
      },
    })

    try {
      const resp = await fetch('/api/admin/referral-partners/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      let body: CreateResponse = {}
      try {
        body = (await resp.json()) as CreateResponse
      } catch (jsonErr: any) {
        logClientError('Failed to parse JSON from create partner', {
          message: jsonErr?.message,
        })
        body = {}
      }

      if (!resp.ok || !body.ok) {
        logClientError('Create partner error', {
          status: resp.status,
          body,
        })
        throw new Error(body.error || 'Failed to create referral partner')
      }

      if (!body.partner || !body.link) {
        throw new Error('Create partner response missing partner or link')
      }

      setLastPartner(body.partner)
      setLastLink(body.link)

      setSuccess('Partner link created successfully.')
      logClient('Created partner successfully', {
        partnerId: body.partner.id,
        name: body.partner.name,
        referralCode: body.partner.referralCode,
        link: body.link,
      })
    } catch (err: any) {
      logClientError('Unexpected error creating partner', {
        message: err?.message,
        stack: err?.stack,
      })
      setError(err?.message || 'Failed to create partner link')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCopyLink() {
    if (!lastLink) return
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(lastLink)
        setSuccess('Link copied to clipboard.')
        logClient('Copied link to clipboard', { link: lastLink })
      } else {
        setError('Clipboard API not available in this browser.')
      }
    } catch (err: any) {
      logClientError('Failed to copy link', {
        message: err?.message,
      })
      setError('Failed to copy link to clipboard.')
    }
  }

  return (
    <>
      <Head>
        <title>Latimere Admin – Referral Partners</title>
      </Head>
      <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold">
                Referral Partners
              </h1>
              <p className="text-sm text-slate-400">
                Create unique referral links for cleaners, realtors, and local businesses.
                Share the link or QR code so they can refer hosts and earn payouts.
              </p>
            </div>
            <div className="text-xs text-slate-500 text-right space-y-1">
              <div>Env: {process.env.NODE_ENV}</div>
              {debugClient && (
                <div className="text-[11px] text-cyan-300">
                  Debug logging enabled (see console)
                </div>
              )}
            </div>
          </header>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl p-6 md:p-8 space-y-4">
            <h2 className="text-sm font-semibold text-slate-100">
              Create a new partner link
            </h2>
            <p className="text-xs text-slate-400">
              Fill in the details below to generate a unique referral code and link. If you
              leave the referral code blank, we&apos;ll generate one automatically from the
              business name.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="name"
                  >
                    Business / Partner name
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-cyan-500"
                    placeholder="Dustan's Cleaning"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="type"
                  >
                    Partner type
                  </label>
                  <select
                    id="type"
                    name="type"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-cyan-500"
                    defaultValue="cleaner"
                  >
                    <option value="cleaner">Cleaner</option>
                    <option value="realtor">Realtor</option>
                    <option value="business">Business</option>
                    <option value="lender">Lender</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="contactName"
                  >
                    Contact name (optional)
                  </label>
                  <input
                    id="contactName"
                    name="contactName"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-cyan-500"
                    placeholder="Dustan"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="contactEmail"
                  >
                    Contact email (optional)
                  </label>
                  <input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-cyan-500"
                    placeholder="dustan@example.com"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="contactPhone"
                  >
                    Contact phone (optional)
                  </label>
                  <input
                    id="contactPhone"
                    name="contactPhone"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-cyan-500"
                    placeholder="555-123-4567"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="referralCode"
                >
                  Custom referral code (optional)
                </label>
                <input
                  id="referralCode"
                  name="referralCode"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-cyan-500"
                  placeholder="DUSTAN01 (leave blank to auto-generate)"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Codes are uppercased and cleaned automatically (A–Z, 0–9 only). If the code
                  is already taken, we&apos;ll add a numeric suffix.
                </p>
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
                className="inline-flex items-center justify-center rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:hover:bg-cyan-500 text-slate-950 font-semibold px-4 py-2.5 text-sm"
              >
                {submitting ? 'Creating partner…' : 'Create partner link'}
              </button>
            </form>
          </div>

          {lastPartner && lastLink && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-3">
              <h2 className="text-sm font-semibold text-slate-100">
                Last created partner
              </h2>
              <div className="text-xs text-slate-300 space-y-1">
                <div>
                  <span className="text-slate-400">Name:</span>{' '}
                  <span className="font-medium text-slate-50">
                    {lastPartner.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Type:</span>{' '}
                  <span className="uppercase text-slate-200">
                    {lastPartner.type || 'business'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Referral code:</span>{' '}
                  <span className="font-mono text-cyan-300">
                    {lastPartner.referralCode}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400">Referral link:</span>
                  <div className="mt-1 flex flex-col md:flex-row md:items-center gap-2">
                    <code className="text-[11px] break-all bg-slate-950/70 border border-slate-700 rounded-lg px-2 py-1">
                      {lastLink}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-[11px]"
                    >
                      Copy link
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Share this link (or convert it to a QR code) with the partner. Any host
                    referred through this link will be tracked to this code.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

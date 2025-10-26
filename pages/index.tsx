// pages/index.tsx
import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'

export default function LatimereLanding() {
  // simple page-mount log
  React.useEffect(() => {
    console.info('[Landing] mounted / rendered (Turo + Host OS removed)')
  }, [])

  return (
    <>
      <Head>
        <title>Latimere • Short-Term Rental Management</title>
        <meta
          name="description"
          content="We manage your Airbnbs—end-to-end STR operations done for you: listings, turnover, pricing, guest messaging, maintenance."
        />
        {/* Social cards (add /public/og.png when ready) */}
        <meta property="og:title" content="Latimere • Short-Term Rental Management" />
        <meta
          property="og:description"
          content="We manage your Airbnbs—end-to-end STR operations done for you: listings, turnover, pricing, guest messaging, maintenance."
        />
        <meta property="og:image" content="/og.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* scroll-smooth makes anchor jumps feel polished */}
      <div className="min-h-screen bg-gray-950 text-white selection:bg-cyan-500/30 scroll-smooth">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="text-base font-semibold tracking-tight">Latimere</div>
            <nav className="hidden gap-6 text-sm sm:flex">
              <a href="#services" className="text-gray-200 hover:text-white">Services</a>
              <a href="#how" className="text-gray-200 hover:text-white">How we work</a>
              <a href="#faq" className="text-gray-200 hover:text-white">FAQ</a>
            </nav>
            <div className="flex items-center gap-3">
              {/* Host OS button removed */}
              <Link
                href="/#contact"
                className="hidden rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 sm:inline-flex"
              >
                Get a Quote
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,197,94,0.10),transparent_40%),radial-gradient(ellipse_at_bottom,_rgba(6,182,212,0.10),transparent_40%)]"
          />
          <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 lg:px-8 lg:pb-20 lg:pt-28">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
              {/* Text */}
              <div>
                <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  We manage your Airbnbs
                </h1>
                <p className="mt-5 max-w-2xl text-lg text-gray-200">
                  Latimere runs your short-term rental operations—listings, turnover, pricing, guest messaging, maintenance—so you can focus on growth.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/#contact"
                    className="inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                  >
                    Get a Free Quote
                  </Link>
                </div>

                <ul className="mt-8 space-y-3 text-gray-200">
                  <li className="flex items-start gap-3">
                    <span className="mt-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    STR ops: guest communications, dynamic pricing, cleaning & inspections, supplies, owner reporting.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 inline-block h-2 w-2 rounded-full bg-cyan-400" />
                    Local, responsive support in Gatlinburg, Pigeon Forge, and Sevierville.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 inline-block h-2 w-2 rounded-full bg-indigo-400" />
                    Transparent performance updates and proactive maintenance coordination.
                  </li>
                </ul>
              </div>

              {/* Visual: responsive screenshot (keep your existing asset) */}
              <div className="lg:justify-self-end">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl backdrop-blur">
                  <div className="mx-auto w-full max-w-[900px] md:max-w-[720px] sm:max-w-[640px]">
                    <Image
                      src="/images/dashboard-demo.png"
                      alt="Latimere — operations overview"
                      width={1600}
                      height={1000}
                      sizes="(min-width:1280px) 900px, (min-width:1024px) 720px, (min-width:640px) 640px, 100vw"
                      priority
                      className="w-full h-auto rounded-xl object-cover md:object-contain"
                      onLoadingComplete={() =>
                        console.info('[HeroImage] loaded /images/dashboard-demo.png')
                      }
                      onError={(e) =>
                        console.warn('[HeroImage] failed to load /images/dashboard-demo.png', e)
                      }
                    />
                  </div>
                  <p className="px-1.5 pt-3 text-xs text-gray-300 text-center"></p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">What we manage</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ServiceCard
                title="Short-Term Rental Management"
                bullets={[
                  'Listing setup & revenue optimization',
                  '24/7 guest messaging & screening',
                  'Cleanings, inspections, supplies & damage claims',
                ]}
                cta={{ label: 'Get STR quote', href: '/#contact' }}
              />
              {/* Second card (Turo) removed */}
            </div>

            {/* Product cross-sell removed (Latimere Host OS) */}
          </div>
        </section>

        {/* How we work */}
        <section id="how" className="border-t border-white/10 bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Simple, transparent onboarding</h2>
            <ol className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                ['Consult', 'We review your properties, goals, and timelines.'],
                ['Configure', 'We set pricing rules, cleaning calendars, and playbooks.'],
                ['Go Live', 'We operate daily and provide regular performance updates.'],
              ].map(([title, desc], i) => (
                <li key={title} className="rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500 text-gray-900 text-sm font-bold">
                      {i + 1}
                    </span>
                    <h3 className="text-base font-semibold">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-200">{desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Contact / Quote */}
        <section id="contact" className="border-t border-white/10">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 shadow-xl backdrop-blur">
              <h2 className="text-xl font-semibold">Request a Quote</h2>
              <p className="mt-2 text-sm text-gray-300">
                Tell us about your rentals—we’ll reply same day with next steps.
              </p>
              <div className="mt-6">
                <QuoteForm />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-white/10 bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">FAQs</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {[
                ['Do you work with single units or portfolios?', 'Both—we tailor pricing to your volume.'],
                ['How do I track performance?', 'We provide transparent reporting and regular updates.'],
                ['What markets do you serve?', 'Gatlinburg, Pigeon Forge, and Sevierville.'],
                ['How is pricing structured?', 'Simple, transparent management fee—ask us for a quote.'],
              ].map(([q, a]) => (
                <div key={q} className="rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                  <h3 className="text-base font-semibold">{q}</h3>
                  <p className="mt-1 text-sm text-gray-200">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-gray-300 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p>© {new Date().getFullYear()} Latimere. All rights reserved.</p>
              <div className="flex gap-4">
                <a href="#services" className="hover:text-white">Services</a>
                <a href="#how" className="hover:text-white">How we work</a>
                <a href="#faq" className="hover:text-white">FAQ</a>
                {/* Host OS footer link removed */}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

/* ——— internal components ——— */

function ServiceCard({
  title,
  bullets,
  cta,
}: {
  title: string
  bullets: string[]
  cta: { label: string; href: string }
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
      <h3 className="text-lg font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-gray-200">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-3">
            <span className="mt-2 inline-block h-2 w-2 rounded-full bg-cyan-400" />
            {b}
          </li>
        ))}
      </ul>
      <Link
        href={cta.href}
        className="mt-4 inline-flex justify-center rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
      >
        {cta.label}
      </Link>
    </div>
  )
}

/** Lead form (Airbnb only). Turo removed; query param coerced to airbnb for safety. */
function QuoteForm() {
  type Service = 'airbnb'
  type Status = 'idle' | 'submitting' | 'success' | 'error'

  const router = useRouter()
  const [service, setService] = React.useState<Service>('airbnb')
  const [status, setStatus] = React.useState<Status>('idle')
  const [message, setMessage] = React.useState<string | null>(null)

  // Read query on mount and subsequent route changes (coerce to airbnb)
  React.useEffect(() => {
    const q = router.query?.service
    const val = Array.isArray(q) ? q[0] : q
    if (val && val !== 'airbnb') {
      console.warn('[QuoteForm] unsupported service in query, coercing to airbnb', { requested: val })
    }
    setService('airbnb')
  }, [router.query?.service])

  // Common fields
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')

  // Airbnb fields
  const [address, setAddress] = React.useState('')
  const [listedBefore, setListedBefore] = React.useState<'yes' | 'no' | ''>('')
  const [sqft, setSqft] = React.useState('')
  const [sleeps, setSleeps] = React.useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setMessage(null)

    if (!name || !email) {
      console.warn('[QuoteForm] missing required name/email', { name, email })
      setStatus('error')
      setMessage('Please provide at least your name and email.')
      return
    }
    if (!address || !sleeps) {
      console.warn('[QuoteForm] Airbnb missing fields', { address, sleeps })
      setStatus('error')
      setMessage('Please add your property address and how many it sleeps.')
      return
    }

    const payload = {
      name,
      phone,
      email,
      service, // always 'airbnb'
      topic: 'Airbnb Management Lead',
      airbnb: { address, listedBefore, squareFootage: sqft, sleeps },
    }

    try {
      console.info('📝 Submitting quote lead → /api/contact', payload)
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await safeJson(res)
      if (res.ok) {
        console.info('✅ Quote lead submitted', { payload, response: data })
        setStatus('success')
        setMessage("Thanks! We'll be in touch shortly.")
        // reset
        setName(''); setPhone(''); setEmail('')
        setAddress(''); setListedBefore(''); setSqft(''); setSleeps('')
      } else {
        console.error('❌ Quote lead failed', { status: res.status, data })
        setStatus('error')
        setMessage(data?.dev?.message || 'We could not submit your request. Please try again shortly.')
      }
    } catch (err) {
      console.error('❌ Quote lead network error', err)
      setStatus('error')
      setMessage('We could not submit your request. Please try again shortly.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Service selector simplified (Airbnb only) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setService('airbnb')}
          className="rounded-lg px-3 py-2 text-sm font-medium border bg-cyan-500 text-gray-900 border-cyan-400"
        >
          Airbnb property
        </button>
      </div>

      {/* Common fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="q-name" label="Your Name *" value={name} onChange={setName} placeholder="Jordan Taylor" />
        <Field id="q-phone" label="Phone Number" value={phone} onChange={setPhone} placeholder="(555) 123-4567" inputMode="tel" />
        <div className="sm:col-span-2">
          <Field id="q-email" label="Email Address *" value={email} onChange={setEmail} placeholder="you@company.com" inputMode="email" type="email" />
        </div>
      </div>

      {/* Airbnb fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id="q-address" label="Property Address *" value={address} onChange={setAddress} placeholder="123 Main St, City, ST" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-100">Previously listed as STR?</label>
          <select
            value={listedBefore}
            onChange={(e) => setListedBefore(e.target.value as any)}
            className="w-full rounded-lg border border-white/15 bg-gray-900 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <Field id="q-sqft" label="Square Footage" value={sqft} onChange={setSqft} placeholder="1600" inputMode="numeric" />
        <Field id="q-sleeps" label="Sleeps *" value={sleeps} onChange={setSleeps} placeholder="6" inputMode="numeric" />
      </div>

      {/* Status message */}
      {message && (
        <div
          className={[
            'rounded-lg px-3 py-2 text-sm',
            status === 'error'
              ? 'bg-red-500/15 text-red-300 border border-red-500/30'
              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
          ].join(' ')}
        >
          {message}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 disabled:opacity-60"
        >
          {status === 'submitting' ? 'Sending…' : 'Request Quote'}
        </button>
        <a
          href="mailto:info@latimere.com"
          className="inline-flex justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
        >
          Email us directly
        </a>
      </div>
    </form>
  )
}

function Field(props: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  inputMode?: string
}) {
  const { id, label, value, onChange, placeholder, type = 'text', inputMode } = props
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm text-gray-100">{label}</label>
      <input
        id={id}
        type={type}
        inputMode={inputMode as any}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/15 bg-gray-900 px-3 py-2 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
      />
    </div>
  )
}

async function safeJson(res: Response) {
  try { return await res.json() } catch { return null }
}

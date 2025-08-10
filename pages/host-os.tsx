// pages/host-os.tsx
import React, { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'

type Status = 'idle' | 'submitting' | 'success' | 'error'

/**
 * Screenshot gallery meta.
 * Replace src values with your actual files in /public/images
 */
const SHOTS: { key: string; src: string; label: string }[] = [
  { key: 'dashboard',  src: '/images/dashboard-demo.png',  label: 'Dashboard overview' },
  { key: 'properties', src: '/images/hostos-properties.png', label: 'Properties list' },
  { key: 'edit-prop',  src: '/images/hostos-edit-property.png', label: 'Edit property' },
  { key: 'edit-unit',  src: '/images/hostos-edit-unit.png',  label: 'Edit unit' },
  { key: 'calendar',   src: '/images/hostos-calendar.png',   label: 'Cleaning calendar' },
]

export default function HostOSPage() {
  const [name, setName]     = useState('')
  const [phone, setPhone]   = useState('')
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)

  // Which screenshot is active in the gallery
  const [activeKey, setActiveKey] = useState(SHOTS[0]?.key ?? 'dashboard')
  const [broken, setBroken] = useState<Record<string, boolean>>({}) // tracks failed screenshots

  const activeShot = useMemo(() => {
    const firstOk = SHOTS.find(s => !broken[s.src]) ?? SHOTS[0]
    const fromKey = SHOTS.find(s => s.key === activeKey && !broken[s.src])
    return fromKey || firstOk
  }, [activeKey, broken])

  useEffect(() => {
    console.log('[HostOS] page mounted', {
      shots: SHOTS.map(s => s.src),
      defaultActive: activeKey,
    })
  }, [])

  async function requestDemo(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setMessage(null)

    if (!name || !email) {
      console.warn('[HostOS Demo] missing required name/email', { name, email })
      setStatus('error')
      setMessage('Please provide at least your name and email.')
      return
    }

    const endpoints = [
      '/api/contact',
      '/api/demo',
      '/api/invitations/send',
      '/api/SendContactMessage',
      '/api/dev/send-invite',
    ]

    let ok = false
    let lastError: any = null

    for (const url of endpoints) {
      try {
        console.log('📨 [HostOS Demo] attempting →', url, { name, phone, email })
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, email, topic: 'Host OS Demo Request' }),
        })
        if (res.ok) {
          ok = true
          break
        }
        lastError = await safeJson(res)
      } catch (err) {
        lastError = err
      }
    }

    if (ok) {
      setStatus('success')
      setMessage("Thanks! We'll be in touch shortly.")
      console.log('✅ [HostOS Demo] submitted', { name, phone, email })
      setName(''); setPhone(''); setEmail('')
    } else {
      setStatus('error')
      setMessage('We could not submit your request. Please try again shortly.')
      console.error('❌ [HostOS Demo] failed', lastError)
    }
  }

  function subscribeNow() {
    const endpoints = ['/api/stripe/checkout', '/api/subscribe']
    ;(async () => {
      for (const url of endpoints) {
        try {
          console.log('🧾 [HostOS Subscribe] attempting →', url)
          const res = await fetch(url, { method: 'POST' })
          if (res.ok) {
            const data = await safeJson(res)
            if (data?.url) {
              window.location.href = data.url
              return
            }
          }
        } catch (err) {
          console.warn('[HostOS Subscribe] endpoint failed:', url, err)
        }
      }
      alert('Subscription flow is not configured yet.')
    })()
  }

  return (
    <>
      <Head>
        <title>Latimere Host OS — Simplify STR Operations</title>
        <meta
          name="description"
          content="Automate cleanings, centralize schedules, and track revenue across all your short‑term rentals with Latimere Host OS."
        />
        {/* Social (add /public/og-hostos.png when ready) */}
        <meta property="og:title" content="Latimere Host OS — Simplify STR Operations" />
        <meta property="og:description" content="Automate cleanings, schedules, and revenue tracking." />
        <meta property="og:image" content="/og-hostos.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* scroll-smooth for polished anchor jumps */}
      <div className="min-h-screen bg-gray-950 text-white selection:bg-cyan-500/30 scroll-smooth">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold tracking-tight">Latimere Host OS</span>
            </div>
            <nav className="hidden gap-6 text-sm sm:flex">
              <a href="#features" className="text-gray-200 hover:text-white">Features</a>
              <a href="#how" className="text-gray-200 hover:text-white">How it works</a>
              <a href="#demo" className="text-gray-200 hover:text-white">Request demo</a>
              <a href="#faq" className="text-gray-200 hover:text-white">FAQ</a>
            </nav>
            <div className="flex items-center gap-3">
              <button
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              >
                Request demo
              </button>
              <button
                onClick={subscribeNow}
                className="hidden rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 sm:inline-flex"
              >
                Subscribe
              </button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,197,94,0.09),transparent_40%),radial-gradient(ellipse_at_bottom,_rgba(6,182,212,0.10),transparent_40%)]"
          />
          <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 lg:px-8 lg:pb-20 lg:pt-24">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
              {/* Text */}
              <div>
                <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  Run your short‑term rentals on autopilot
                </h1>
                <p className="mt-5 max-w-2xl text-lg text-gray-200">
                  Latimere Host OS centralizes properties, units, cleanings, schedules, and revenue—so you can grow faster with less chaos.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                    className="inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                  >
                    Request a Free Demo
                  </button>
                </div>

                <ul className="mt-8 space-y-3 text-gray-200">
                  <li className="flex items-start gap-3">
                    <span className="mt-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    Cleaning assignment & invite flows, built‑in.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 inline-block h-2 w-2 rounded-full bg-cyan-400" />
                    Owner & cleaner roles with secure AppSync auth.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 inline-block h-2 w-2 rounded-full bg-indigo-400" />
                    Revenue tracking with property & unit rollups.
                  </li>
                </ul>
              </div>

              {/* Visual: Screenshot gallery */}
              <div className="lg:justify-self-end">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl backdrop-blur">
                  {/* Main image */}
                  <div className="relative aspect-[16/10] w-full max-w-[840px] overflow-hidden rounded-xl border border-white/10">
                    <Image
                      key={activeShot?.src}
                      src={broken[activeShot?.src ?? ''] ? '/images/dashboard-demo.png' : (activeShot?.src ?? '/images/dashboard-demo.png')}
                      alt={`Latimere Host OS — ${activeShot?.label ?? 'screenshot'}`}
                      fill
                      priority
                      sizes="(min-width:1280px) 840px, (min-width:1024px) 640px, (min-width:640px) 90vw, 100vw"
                      className="object-contain"
                      onLoadingComplete={() => console.log('[HostOS Hero] loaded', activeShot?.src)}
                      onError={() => {
                        const src = activeShot?.src
                        if (src) {
                          console.warn('[HostOS Hero] failed, marking broken and falling back', src)
                          setBroken(prev => ({ ...prev, [src]: true }))
                        }
                      }}
                    />
                  </div>

                  {/* Thumbnails */}
                  <div className="mt-3 flex items-center gap-2 overflow-x-auto">
                    {SHOTS.map((s) => {
                      const selected = s.key === activeKey && !broken[s.src]
                      return (
                        <button
                          key={s.key}
                          type="button"
                          aria-label={`Show ${s.label}`}
                          onClick={() => {
                            console.log('[HostOS Gallery] thumbnail clicked', { key: s.key, src: s.src })
                            setActiveKey(s.key)
                          }}
                          className={[
                            'relative h-14 w-24 shrink-0 overflow-hidden rounded-md border transition',
                            selected ? 'border-cyan-400 ring-2 ring-cyan-400/40' : 'border-white/15 hover:border-white/30'
                          ].join(' ')}
                          title={s.label}
                        >
                          <Image
                            src={broken[s.src] ? '/images/dashboard-demo.png' : s.src}
                            alt={s.label}
                            fill
                            sizes="96px"
                            className="object-cover"
                            onError={() => {
                              console.warn('[HostOS Gallery] thumb failed', s.src)
                              setBroken(prev => ({ ...prev, [s.src]: true }))
                            }}
                          />
                        </button>
                      )
                    })}
                  </div>

                  <p className="px-1.5 pt-3 text-xs text-gray-300">{activeShot?.label || 'Dashboard preview'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Everything you need to scale</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Properties & Units', 'Create, edit, and organize everything in one place.'],
                ['Smart Cleaning Ops', 'Auto‑assign cleaners, track status, and mark complete.'],
                ['Calendar View', 'See all upcoming cleanings at a glance.'],
                ['Role‑Based Access', 'Secure owner/cleaner access with Cognito & AppSync.'],
                ['Revenue Module', 'Actuals, projections, and rollups per unit/property.'],
                ['Invites & Onboarding', 'Frictionless flows to add owners and cleaners.'],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-gray-200">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-white/10 bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">From signup to first cleaning in minutes</h2>
            <ol className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                ['Connect', 'Add your first property & units.'],
                ['Invite', 'Send cleaner and owner invites.'],
                ['Automate', 'Schedule cleanings and track revenue.'],
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

        {/* Demo form */}
        <section id="demo" className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Request a Free Demo</h2>
                <p className="mt-3 max-w-xl text-gray-200">
                  See Latimere Host OS in action—cleanings, scheduling, and revenue tracking working together.
                </p>
                <ul className="mt-6 space-y-2 text-gray-200 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="mt-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    No pressure, no long calls—quick walkthrough tailored to your workflow.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-2 inline-block h-2 w-2 rounded-full bg-indigo-400" />
                    We’ll help migrate your existing data when you’re ready.
                  </li>
                </ul>
              </div>

              <div className="w-full max-w-xl lg:justify-self-end">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 shadow-xl backdrop-blur">
                  <form onSubmit={requestDemo} className="space-y-5">
                    <Field
                      id="name"
                      label={<>Your Name <span className="text-red-400">*</span></>}
                      value={name}
                      onChange={setName}
                      placeholder="Jordan Taylor"
                    />
                    <Field
                      id="phone"
                      label="Phone Number"
                      value={phone}
                      onChange={setPhone}
                      placeholder="(555) 123‑4567"
                      type="tel"
                      inputMode="tel"
                    />
                    <Field
                      id="email"
                      label={<>Email Address <span className="text-red-400">*</span></>}
                      value={email}
                      onChange={setEmail}
                      placeholder="you@company.com"
                      type="email"
                      inputMode="email"
                    />

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

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 disabled:opacity-60"
                      >
                        {status === 'submitting' ? 'Sending…' : 'Request Demo'}
                      </button>
                      <button
                        type="button"
                        onClick={subscribeNow}
                        className="inline-flex justify-center rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
                      >
                        Subscribe Now
                      </button>
                    </div>

                    <p className="pt-2 text-xs text-gray-300">
                      By submitting this form, you agree to be contacted about Latimere Host OS. You can unsubscribe at any time.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-white/10 bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">FAQs</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {[
                ['Is this for co‑hosting too?', 'Latimere Host OS focuses on running your STR operations. You can invite owners/cleaners and keep everyone in sync.'],
                ['How is data secured?', 'We use Cognito and AppSync auth patterns with role‑based access to protect sensitive data.'],
                ['Can I import existing data?', 'Yes. We can help you migrate properties, units, and historical cleanings.'],
                ['What does pricing look like?', 'Simple monthly pricing; contact us for current tiers and enterprise plans.'],
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
                <a href="#features" className="hover:text-white">Features</a>
                <a href="#how" className="hover:text-white">How it works</a>
                <a href="#demo" className="hover:text-white">Request demo</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

/* ——— helpers & small components ——— */

function Field(props: {
  id: string
  label: React.ReactNode
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

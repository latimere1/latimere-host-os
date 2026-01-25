// pages/index.tsx
import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import type { GetStaticProps } from 'next'
import dynamic from 'next/dynamic'

// Shared top nav & footer (consistent across blog + landing)
import TopNav from '../components/TopNav'
import SiteFooter from '../components/SiteFooter'

// Blog helpers
import { getAllPosts, type BlogPost } from '../lib/blog'

// Community CTA is optional; load only if the flag is ON
const ENABLE_COMMUNITY = process.env.NEXT_PUBLIC_ENABLE_COMMUNITY === '1'
const CommunityCTA = ENABLE_COMMUNITY
  ? dynamic(() => import('../components/community/CTA'), {
      ssr: false,
      loading: () => (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-gray-300">
          Loading…
        </div>
      ),
    })
  : null

type LandingProps = {
  latestPosts: BlogPost[] // up to 3 most-recent posts
}

export const getStaticProps: GetStaticProps<LandingProps> = async () => {
  try {
    const posts = getAllPosts().slice(0, 3)
    if (process.env.NEXT_PUBLIC_ENV !== 'production') {
      console.info(
        '[build:getStaticProps] blog posts found:',
        posts.map((p) => p.slug)
      )
    }
    return { props: { latestPosts: posts } }
  } catch (err) {
    console.error('getStaticProps failed to load blog posts:', err)
    return { props: { latestPosts: [] } }
  }
}

export default function LatimereLanding({ latestPosts }: LandingProps) {
  const router = useRouter()

  /* ---------- diagnostics ---------- */
  React.useEffect(() => {
    console.info('[Landing] mounted', {
      path: router.asPath,
      env: process.env.NODE_ENV,
      ENABLE_COMMUNITY,
      blogCount: latestPosts?.length ?? 0,
    })
  }, [router.asPath, latestPosts?.length])

  // Observe first visibility for key sections (simple/safe)
  React.useEffect(() => {
    try {
      const els = Array.from(
        document.querySelectorAll<HTMLElement>('[data-section-id]')
      )
      const seen = new Set<string>()
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            const id = (e.target as HTMLElement).dataset.sectionId!
            if (e.isIntersecting && !seen.has(id)) {
              seen.add(id)
              console.info(`[Section] visible: #${id}`)
            }
          })
        },
        { rootMargin: '0px 0px -30% 0px', threshold: 0.25 }
      )
      els.forEach((el) => io.observe(el))
      return () => io.disconnect()
    } catch (err) {
      console.warn('[Observer] init failed', err)
    }
  }, [])

  // Prefetch routes on first hover to make nav snappy
  const prefetchOnce = React.useRef({
    community: false,
  })

  const prefetchCommunity = React.useCallback(() => {
    if (!ENABLE_COMMUNITY) return
    if (!prefetchOnce.current.community) {
      router.prefetch('/community').catch(() => {})
      prefetchOnce.current.community = true
      console.info('[Prefetch] /community')
    }
  }, [router])

  // Build canonical (SSR-safe). If NEXT_PUBLIC_APP_URL is missing, this will be relative in dev.
  const appUrlEnv = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const canonicalHref = appUrlEnv ? `${appUrlEnv}/` : '/'

  // JSON-LD (SoftwareApplication)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Latimere Program Copilot',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: appUrlEnv || 'https://latimere.com',
        image: '/og.png',
        description:
          'Program Copilot automates weekly status, RAID, and decision reporting across workstreams with evidence-linked citations from transcripts and work items. Draft → review → publish in minutes.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description:
            'Paid pilots and enterprise plans available. Pricing depends on program size and integrations.',
        },
      },
      {
        '@type': 'Organization',
        name: 'Latimere',
        url: appUrlEnv || 'https://latimere.com',
        logo: '/og.png',
      },
    ],
  }

  return (
    <>
      <Head>
        <title>Latimere • Program Copilot for Status + RAID Reporting</title>
        <meta
          name="description"
          content="Automate weekly executive status, RAID logs, and decision tracking across workstreams with evidence-linked citations from meeting transcripts and work items. Draft → review → publish in minutes."
        />

        {/* Canonical & robots */}
        <link rel="canonical" href={canonicalHref} />
        <meta name="robots" content="index,follow" />

        {/* Social cards */}
        <meta
          property="og:title"
          content="Latimere • Program Copilot for Status + RAID Reporting"
        />
        <meta
          property="og:description"
          content="Cut weekly reporting time from hours to minutes. Evidence-backed bullets, PM review workflows, and exec-ready exports."
        />
        <meta property="og:image" content="/og.png" />
        <meta property="og:url" content={canonicalHref} />
        <meta name="twitter:card" content="summary_large_image" />

        {/* Favicons (keep existing config) */}
        <link rel="icon" href="/favicon.ico?v=3" />
        <link
          rel="icon"
          type="image/x-icon"
          href="/images/FFF-latimere-hosting-ICON-FAV-32PX.ico?v=3"
        />
        <link
          rel="icon"
          type="image/x-icon"
          href="/images/FFF-latimere-hosting-ICON-FAV-16PX.ico?v=3"
          sizes="16x16"
        />
        <link
          rel="apple-touch-icon"
          href="/images/FFF-latimere-hosting-ICON-FAV%2032PX.png?v=3"
        />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <div className="min-h-screen bg-gray-950 text-white selection:bg-cyan-500/30 scroll-smooth">
        {/* Shared header/nav */}
        <TopNav />

        <main id="main">
          {/* HERO */}
          <section data-section-id="hero" className="relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.14),transparent_60%)]"
            />
            <div className="mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 sm:pt-20 lg:px-8">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-gray-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    Program Copilot • Status + RAID Automation
                  </div>

                  <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                    Executive ready status reports, generated with proof.
                  </h1>
                  <p className="mt-4 max-w-prose text-gray-200">
                    Latimere Program Copilot turns transcripts and work items into
                    weekly program reporting in minutes: status, RAID, decisions, and
                    leadership asks, each bullet backed by evidence you can click.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <a
                      href="#contact"
                      className="inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                      onClick={() =>
                        console.info('[CTA] hero → Request pilot clicked')
                      }
                    >
                      Request a pilot
                    </a>
                    <a
                      href="#workflow"
                      className="inline-flex justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      onClick={() =>
                        console.info('[CTA] hero → See workflow clicked')
                      }
                    >
                      See the workflow
                    </a>
                    <a
                      href="#evidence"
                      className="inline-flex justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      onClick={() =>
                        console.info('[CTA] hero → Evidence model clicked')
                      }
                    >
                      Evidence model
                    </a>
                  </div>

                  <ul className="mt-7 grid grid-cols-1 gap-3 text-gray-200 sm:grid-cols-3">
                    {heroBullets.map((t) => (
                      <li key={t} className="flex items-start gap-3">
                        <span className="mt-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-sm">{t}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-gray-300">
                    <span className="font-semibold text-gray-100">Example Application:</span>{' '}
                    ERP/HCM and transformation programs where weekly reporting and
                    governance decisions are high-stakes.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <h2 className="text-base font-semibold text-gray-100">
                    What Program Copilot replaces
                  </h2>
                  <p className="mt-2 text-sm text-gray-300">
                    Manual rollups across workstreams, disconnected spreadsheets,
                    and “status by vibe.” Replace it with repeatable templates,
                    approvals, and proof.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {replaceCards.map((c) => (
                      <div
                        key={c.title}
                        className="rounded-xl border border-white/10 bg-gray-950/40 p-4"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                          {c.kicker}
                        </div>
                        <div className="mt-1 text-sm font-semibold">{c.title}</div>
                        <div className="mt-1 text-sm text-gray-300">{c.desc}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-xl border border-white/10 bg-gray-950/60 p-4">
                    <div className="text-sm font-semibold">The outcome</div>
                    <ul className="mt-2 space-y-1 text-sm text-gray-300">
                      <li>• Weekly reporting time drops from hours → minutes</li>
                      <li>• Fewer missed risks, decisions, and dependencies</li>
                      <li>• Leadership trust improves because every claim has proof</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TRUST STRIP */}
          <section data-section-id="trust" className="border-t border-white/10">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
                {[
                  ['Draft', 'Fast'],
                  ['Cite', 'Evidence'],
                  ['Review', 'Workflow'],
                  ['Track', 'Deltas'],
                  ['Export', 'Exec-ready'],
                  ['Scale', 'Programs'],
                ].map(([v, l]) => (
                  <div
                    key={l}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3"
                  >
                    <div className="text-lg font-extrabold">{v}</div>
                    <div className="text-[11px] text-gray-300">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* WORKFLOW */}
          <section
            id="workflow"
            data-section-id="workflow"
            className="border-t border-white/10 bg-white/[0.02]"
          >
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-gray-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    MVP workflow
                  </div>

                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Built for how PMOs actually work.
                  </h2>
                  <p className="mt-2 max-w-prose text-sm text-gray-300">
                    Contributors submit a lightweight check-in. The PM reviews and
                    approves. Stakeholders receive the report without needing a login.
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {workflowCards.map((s) => (
                      <div
                        key={s.title}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                          {s.kicker}
                        </div>
                        <h3 className="mt-2 text-base font-semibold">{s.title}</h3>
                        <p className="mt-1 text-sm text-gray-300">{s.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <a
                      href="#contact"
                      className="inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                      onClick={() => console.info('[CTA] workflow → Request pilot clicked')}
                    >
                      Request a pilot
                    </a>
                    <a
                      href="#how"
                      className="inline-flex justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      onClick={() => console.info('[CTA] workflow → How it works clicked')}
                    >
                      How it works
                    </a>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="text-sm font-semibold text-cyan-300">
                    Outputs teams already use
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {outputCards.map((u) => (
                      <div
                        key={u.title}
                        className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                      >
                        <div className="text-sm font-semibold">{u.title}</div>
                        <div className="mt-1 text-sm text-gray-300">{u.desc}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-xl border border-white/10 bg-gray-950/60 p-4">
                    <h4 className="text-sm font-semibold">MVP promise</h4>
                    <ul className="mt-2 space-y-1 text-sm text-gray-300">
                      <li>• Generate + edit a report draft quickly</li>
                      <li>• Every bullet has clickable evidence</li>
                      <li>• Publish in the formats stakeholders expect</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* EVIDENCE MODEL */}
          <section
            id="evidence"
            data-section-id="evidence"
            className="border-t border-white/10"
          >
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Evidence-backed by default
              </h2>
              <p className="mt-2 max-w-prose text-sm text-gray-300">
                “Show Sources” is the product. Each claim is tied to transcript
                excerpts and/or work items so PMs can review fast and executives can
                trust the output.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {evidenceFeatureCards.map((f) => (
                  <div
                    key={f.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                      {f.kicker}
                    </div>
                    <h3 className="mt-2 text-base font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-gray-300">{f.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#contact"
                  className="inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                  onClick={() =>
                    console.info('[CTA] evidence → Request pilot clicked')
                  }
                >
                  Request a pilot
                </a>
                <a
                  href="#security"
                  className="inline-flex justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  onClick={() =>
                    console.info('[CTA] evidence → Security clicked')
                  }
                >
                  Security notes
                </a>
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section
            id="how"
            data-section-id="how"
            className="border-t border-white/10 bg-white/[0.02]"
          >
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                How it works
              </h2>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {howItWorksSteps.map((s) => (
                  <div
                    key={s.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                      Step {s.step}
                    </div>
                    <h3 className="mt-2 text-base font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm text-gray-300">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PRICING */}
          <section
            id="pricing"
            data-section-id="pricing"
            className="border-t border-white/10"
          >
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Pilot pricing
                  </h2>
                  <p className="mt-1 text-sm text-gray-300">
                    Price by program workspace (not by stakeholder seats).
                  </p>
                </div>
                <a
                  href="#contact"
                  className="inline-flex justify-center rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                  onClick={() =>
                    console.info('[CTA] pricing → Talk to sales clicked')
                  }
                >
                  Talk to sales →
                </a>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {pricingCards.map((p) => (
                  <div
                    key={p.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
                  >
                    <div className="text-sm font-semibold">{p.title}</div>
                    <div className="mt-2 text-2xl font-extrabold">{p.price}</div>
                    <div className="mt-2 text-sm text-gray-300">{p.desc}</div>
                    <ul className="mt-4 space-y-1 text-sm text-gray-300">
                      {p.bullets.map((b) => (
                        <li key={b}>• {b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECURITY / COMPLIANCE */}
          <section
            id="security"
            data-section-id="security"
            className="border-t border-white/10 bg-white/[0.02]"
          >
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Security, privacy, and auditability
              </h2>
              <p className="mt-2 max-w-prose text-sm text-gray-300">
                Designed for enterprise environments where program data, transcripts,
                and reporting artifacts require careful access controls and traceability.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {securityCards.map((s) => (
                  <div
                    key={s.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                      {s.kicker}
                    </div>
                    <h3 className="mt-2 text-base font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm text-gray-300">{s.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#contact"
                  className="inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                  onClick={() =>
                    console.info('[CTA] security → Request pilot clicked')
                  }
                >
                  Request a pilot
                </a>
                <a
                  href="#faq"
                  className="inline-flex justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  onClick={() => console.info('[CTA] security → FAQ clicked')}
                >
                  Read FAQs
                </a>
              </div>
            </div>
          </section>

          {/* (Optional) COMMUNITY CTA */}
          {ENABLE_COMMUNITY && CommunityCTA && (
            <section
              data-section-id="community"
              className="border-t border-white/10 bg-white/[0.02]"
            >
              <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <CommunityCTA
                  title="Join the Latimere Community"
                  body="Discuss reporting templates, PMO governance patterns, and implementation lessons."
                  buttonLabel="Visit Community"
                  href="/community?utm_source=landing&utm_medium=banner&utm_campaign=community"
                  eventLabel="landing_banner_community"
                  variant="outline"
                  onClick={() => console.info('[CTA] community → banner clicked')}
                  onMouseEnter={prefetchCommunity}
                />
              </div>
            </section>
          )}

          {/* CONTACT */}
          <section
            id="contact"
            data-section-id="contact"
            className="border-t border-white/10"
          >
            <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 items-start gap-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur sm:p-8 lg:grid-cols-2">
                <div className="self-start">
                  <h2 className="text-xl font-semibold">
                    Request a pilot or join early access
                  </h2>
                  <p className="mt-2 text-sm text-gray-300">
                    Tell us your program size, tools (ADO/Jira/Teams), and cadence.
                    We’ll reply with next steps.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-300">
                    <li>• Fast response</li>
                    <li>• Evidence-backed outputs</li>
                    <li>• Stakeholders don’t need logins</li>
                  </ul>
                </div>
                <div className="self-start">
                  <LeadForm />
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section
            id="faq"
            data-section-id="faq"
            className="border-t border-white/10 bg-white/[0.02]"
          >
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                FAQs
              </h2>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {faqItems.map(([q, a]) => (
                  <div
                    key={q}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                  >
                    <h3 className="text-base font-semibold">{q}</h3>
                    <p className="mt-1 text-sm text-gray-200">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  )
}

/* ---------- content data ---------- */

const heroBullets = [
  'Evidence-linked bullets by default',
  'PM review + approval workflow',
  'Exports stakeholders already use',
]

const replaceCards = [
  {
    kicker: 'Before',
    title: 'Manual rollups',
    desc: 'PMs chase updates across workstreams and rewrite them into a single narrative.',
  },
  {
    kicker: 'Before',
    title: 'Unprovable status',
    desc: 'Stakeholders don’t trust RAG changes without supporting evidence.',
  },
  {
    kicker: 'After',
    title: 'Evidence-backed reporting',
    desc: 'Each bullet links to the transcript excerpt and/or work item that supports it.',
  },
  {
    kicker: 'After',
    title: 'Repeatable governance',
    desc: 'Draft → review → publish with consistent templates and audit-friendly history.',
  },
]

const workflowCards = [
  {
    kicker: 'Setup',
    title: 'Create a program workspace',
    desc: 'Define workstreams, contributors, cadence, and stakeholder distribution.',
  },
  {
    kicker: 'Contribute',
    title: 'Workstreams submit check-ins',
    desc: 'Lightweight weekly form. AI pre-fills and contributors confirm/edit.',
  },
  {
    kicker: 'Review',
    title: 'PM reviews + approves',
    desc: 'Merge workstreams, request changes, and finalize the executive narrative.',
  },
  {
    kicker: 'Publish',
    title: 'Distribute without logins',
    desc: 'Send exec-ready exports and a read-only link to stakeholders.',
  },
]

const outputCards = [
  {
    title: 'Weekly Status Report',
    desc: 'Exec summary, achievements, leadership asks, next steps.',
  },
  {
    title: 'RAID Log',
    desc: 'Risks, issues, dependencies with owners and due dates.',
  },
  {
    title: 'Decision Log',
    desc: 'What was decided, by whom, when, and the impact.',
  },
  {
    title: 'Change Highlights',
    desc: 'What changed since last cycle and why it matters.',
  },
]

const evidenceFeatureCards = [
  {
    kicker: 'Citations',
    title: '“Show Sources” for every claim',
    desc: 'Bullets reference evidence chunk IDs tied to transcripts and work items.',
  },
  {
    kicker: 'Validation',
    title: 'Reject missing sources',
    desc: 'If citations don’t resolve to stored evidence, they don’t ship to stakeholders.',
  },
  {
    kicker: 'Deltas',
    title: 'What changed since last week',
    desc: 'Snapshot and compare cycles so changes are obvious and defensible.',
  },
  {
    kicker: 'Integrations',
    title: 'Connect ADO/Jira',
    desc: 'Read-only pull of work items to prefill updates and ground evidence.',
  },
  {
    kicker: 'Exports',
    title: 'DOCX-first',
    desc: 'Export formats match how enterprises actually run governance today.',
  },
  {
    kicker: 'Workflow',
    title: 'Approvals built in',
    desc: 'Draft → submitted → returned → approved → published state model.',
  },
]

const howItWorksSteps = [
  {
    step: 1,
    title: 'Ingest evidence',
    desc: 'Upload transcripts and pull work items (ADO/Jira) into an evidence index.',
  },
  {
    step: 2,
    title: 'Generate drafts',
    desc: 'AI proposes bullets, RAID entries, and decisions, each with citations.',
  },
  {
    step: 3,
    title: 'Human review',
    desc: 'Contributors confirm their sections; PM approves the final narrative.',
  },
  {
    step: 4,
    title: 'Publish',
    desc: 'Export and distribute to stakeholders with consistent templates and history.',
  },
]

const pricingCards = [
  {
    title: 'Pilot',
    price: '$2.5k/mo',
    desc: 'Fast start for one program workspace.',
    bullets: [
      '1 program workspace',
      'Up to 10 contributors',
      'Unlimited stakeholder viewers',
      'Transcript upload + citations',
      'DOCX export',
    ],
  },
  {
    title: 'Delivery',
    price: '$7.5k/mo',
    desc: 'For active programs with multiple workstreams.',
    bullets: [
      'Up to 50 contributors',
      'ADO or Jira read-only integration',
      'Cadence + reminders',
      'Change highlights',
      'Basic audit trail',
    ],
  },
  {
    title: 'Enterprise',
    price: 'Custom',
    desc: 'Portfolio-wide rollout and enterprise controls.',
    bullets: [
      'Multiple programs / portfolios',
      'SSO + governance controls',
      'Retention policies',
      'Advanced audit logging',
      'Priority support',
    ],
  },
]

const securityCards = [
  {
    kicker: 'Access',
    title: 'Role-based controls',
    desc: 'PMs and contributors have accounts; stakeholders can receive read-only outputs.',
  },
  {
    kicker: 'Data',
    title: 'Scoped integrations',
    desc: 'Read-only connectors (ADO/Jira) with least-privilege scopes for MVP.',
  },
  {
    kicker: 'Audit',
    title: 'Evidence-first history',
    desc: 'Track what was generated, edited, approved, and published per cycle.',
  },
  {
    kicker: 'Privacy',
    title: 'Transcript handling',
    desc: 'Support redaction patterns and avoid over-collection (MVP: manual uploads).',
  },
  {
    kicker: 'Reliability',
    title: 'Fail-safe publishing',
    desc: 'If citations fail validation, we block publish and log diagnostics.',
  },
  {
    kicker: 'Enterprise',
    title: 'Procurement-ready roadmap',
    desc: 'SSO, retention, and policy controls can layer in after MVP traction.',
  },
]

const faqItems: [string, string][] = [
  [
    'Is this just meeting summarization?',
    'No. Program Copilot is governance-grade: evidence-linked reporting, approvals, deltas, and exports stakeholders actually use.',
  ],
  [
    'Do stakeholders need a login?',
    'No. Only PMs and contributors need accounts. Stakeholders receive reports via email/export and optional read-only links.',
  ],
  [
    'What tools do you support?',
    'MVP supports transcript upload and a read-only integration to Azure DevOps or Jira.',
  ],
  [
    'Can PMs edit the report?',
    'Yes. PMs can edit the narrative while preserving evidence links and validation.',
  ],
  [
    'How do you prevent hallucinations?',
    'By constraining generation to pre-validated evidence chunks and rejecting citations that don’t resolve to stored sources.',
  ],
  [
    'How is this priced?',
    'By program workspace (not stakeholder seats). Pilot pricing is designed to be easy to approve and expand program-by-program.',
  ],
]

/* ---------- form components ---------- */

function LeadForm() {
  type Mode = 'enterprise' | 'early_access'
  type Status = 'idle' | 'submitting' | 'success' | 'error'

  const router = useRouter()

  const [mode, setMode] = React.useState<Mode>('enterprise')
  const [status, setStatus] = React.useState<Status>('idle')
  const [message, setMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    const qMode = router.query?.mode
    const modeVal = Array.isArray(qMode) ? qMode[0] : qMode

    if (modeVal === 'enterprise' || modeVal === 'early_access') {
      setMode(modeVal)
      console.info('[LeadForm] mode from query', modeVal)
    } else if (modeVal) {
      console.warn('[LeadForm] unsupported mode in query', { requested: modeVal })
    }
  }, [router.query?.mode])

  // Shared fields
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')

  // Enterprise fields
  const [company, setCompany] = React.useState('')
  const [programType, setProgramType] = React.useState('')
  const [tooling, setTooling] = React.useState('')
  const [workstreams, setWorkstreams] = React.useState('')
  const [cadence, setCadence] = React.useState('')
  const [currentProcess, setCurrentProcess] = React.useState('')

  // Early access fields
  const [earlyGoal, setEarlyGoal] = React.useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setMessage(null)

    if (!name || !email) {
      console.warn('[LeadForm] missing name/email')
      setStatus('error')
      setMessage('Please provide at least your name and email.')
      return
    }

    if (mode === 'enterprise') {
      if (!company || !programType || !tooling || !cadence) {
        console.warn('[LeadForm] missing enterprise fields', {
          company,
          programType,
          tooling,
          cadence,
        })
        setStatus('error')
        setMessage('Please add company, program type, tools, and cadence.')
        return
      }
    } else {
      if (!earlyGoal) {
        console.warn('[LeadForm] missing earlyGoal')
        setStatus('error')
        setMessage('Please tell us what you want to use Program Copilot for.')
        return
      }
    }

    const payload = {
      name,
      phone,
      email,
      mode,
      topic:
        mode === 'enterprise'
          ? 'Program Copilot Pilot Request'
          : 'Program Copilot Early Access',
      enterprise:
        mode === 'enterprise'
          ? {
              company,
              programType,
              tooling,
              workstreams,
              cadence,
              currentProcess,
            }
          : null,
      wallet:
        mode === 'early_access'
          ? {
              walletGoal: earlyGoal,
            }
          : null,
      meta: {
        page: 'landing',
        ts: Date.now(),
        path: typeof window !== 'undefined' ? window.location.pathname : '/',
      },
    }

    try {
      console.info('Submitting → /api/contact', { mode, topic: payload.topic })
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await safeJson(res)

      if (res.ok) {
        console.info('Lead submitted', { response: data, mode })

        try {
          ;(window as any).latimereTrackLead?.(
            mode === 'enterprise'
              ? 'programcopilot_enterprise_pilot'
              : 'programcopilot_early_access'
          )
        } catch {}

        setStatus('success')
        setMessage(
          mode === 'enterprise'
            ? "Thanks! We'll reach out shortly to schedule your pilot."
            : "Thanks! You're on the early access list."
        )

        setName('')
        setEmail('')
        setPhone('')

        setCompany('')
        setProgramType('')
        setTooling('')
        setWorkstreams('')
        setCadence('')
        setCurrentProcess('')

        setEarlyGoal('')
      } else {
        console.error('Lead failed', { status: res.status, data, mode })
        setStatus('error')
        setMessage(
          (data as any)?.dev?.message ||
            'We couldn’t submit your request. Please try again shortly.'
        )
      }
    } catch (err) {
      console.error('Lead network error', err)
      setStatus('error')
      setMessage('We couldn’t submit your request. Please try again shortly.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" aria-label="Lead form">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setMode('enterprise')
            console.info('[LeadForm] mode set → enterprise')
          }}
          className={[
            'rounded-lg border px-3 py-2 text-sm font-medium',
            mode === 'enterprise'
              ? 'border-cyan-400 bg-cyan-500 text-gray-900'
              : 'border-white/15 bg-white/5 text-gray-100 hover:bg-white/10',
          ].join(' ')}
          aria-pressed={mode === 'enterprise'}
        >
          Pilot request
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('early_access')
            console.info('[LeadForm] mode set → early_access')
          }}
          className={[
            'rounded-lg border px-3 py-2 text-sm font-medium',
            mode === 'early_access'
              ? 'border-cyan-400 bg-cyan-500 text-gray-900'
              : 'border-white/15 bg-white/5 text-gray-100 hover:bg-white/10',
          ].join(' ')}
          aria-pressed={mode === 'early_access'}
        >
          Early access
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="l-name"
          label="Your Name *"
          value={name}
          onChange={setName}
          placeholder="Jordan Taylor"
        />
        <Field
          id="l-phone"
          label="Phone Number"
          value={phone}
          onChange={setPhone}
          placeholder="(555) 123-4567"
          inputMode="tel"
        />
        <div className="sm:col-span-2">
          <Field
            id="l-email"
            label="Email Address *"
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
            inputMode="email"
            type="email"
          />
        </div>
      </div>

      {mode === 'enterprise' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              id="l-company"
              label="Company *"
              value={company}
              onChange={setCompany}
              placeholder="Acme Corp"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              className="mb-1 block text-sm text-gray-100"
              htmlFor="l-program-type"
            >
              Program type *
            </label>
            <select
              id="l-program-type"
              value={programType}
              onChange={(e) => setProgramType(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-gray-900 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
            >
              <option value="">Select</option>
              <option value="erp_hcm">ERP / HCM Implementation</option>
              <option value="transformation">Transformation / PMO</option>
              <option value="platform_delivery">Platform / Engineering Delivery</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-gray-100" htmlFor="l-tooling">
              Primary tools *
            </label>
            <select
              id="l-tooling"
              value={tooling}
              onChange={(e) => setTooling(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-gray-900 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
            >
              <option value="">Select</option>
              <option value="ado_teams">Azure DevOps + Teams</option>
              <option value="jira_confluence">Jira + Confluence</option>
              <option value="mixed">Mixed / Other</option>
            </select>
          </div>

          <Field
            id="l-workstreams"
            label="Approx. number of workstreams"
            value={workstreams}
            onChange={setWorkstreams}
            placeholder="6"
            inputMode="numeric"
          />

          <Field
            id="l-cadence"
            label="Reporting cadence *"
            value={cadence}
            onChange={setCadence}
            placeholder="Weekly / Biweekly / Monthly"
          />

          <div className="sm:col-span-2">
            <Field
              id="l-process"
              label="Current reporting process (optional)"
              value={currentProcess}
              onChange={setCurrentProcess}
              placeholder="PowerPoint deck, Word doc, spreadsheets, emails..."
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <Field
            id="l-early-goal"
            label="What do you want to use Program Copilot for? *"
            value={earlyGoal}
            onChange={setEarlyGoal}
            placeholder="Weekly exec status, RAID tracking, decisions, PMO governance..."
          />
        </div>
      )}

      {message && (
        <div
          className={[
            'rounded-lg px-3 py-2 text-sm border',
            status === 'error'
              ? 'bg-red-500/15 text-red-300 border-red-500/30'
              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          ].join(' ')}
          role={status === 'error' ? 'alert' : 'status'}
        >
          {message}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 disabled:opacity-60"
          onClick={() => console.info('[CTA] contact → Submit clicked', { mode })}
        >
          {status === 'submitting'
            ? 'Sending…'
            : mode === 'enterprise'
              ? 'Request Pilot'
              : 'Join Early Access'}
        </button>

        <a
          href="mailto:taylor@latimere.com"
          className="inline-flex justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
        >
          Email us directly
        </a>
      </div>

      <p className="text-xs text-gray-400"></p>
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
  const { id, label, value, onChange, placeholder, type = 'text', inputMode } =
    props
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm text-gray-100">
        {label}
      </label>
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
  try {
    return await res.json()
  } catch {
    return null
  }
}

// pages/index.tsx
import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
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
    blog: false,
  })

  const prefetchCommunity = React.useCallback(() => {
    if (!ENABLE_COMMUNITY) return
    if (!prefetchOnce.current.community) {
      router.prefetch('/community').catch(() => {})
      prefetchOnce.current.community = true
      console.info('[Prefetch] /community')
    }
  }, [router])

  const prefetchBlog = React.useCallback(() => {
    if (!prefetchOnce.current.blog) {
      router.prefetch('/blog').catch(() => {})
      prefetchOnce.current.blog = true
      console.info('[Prefetch] /blog')
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
        name: 'Latimere Identity Rails',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: appUrlEnv || 'https://latimere.com',
        image: '/og.png',
        description:
          'Digital identity + verifiable credentials platform for issuing, storing, verifying, and governing credentials with policy controls and audit evidence.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free wallet tier available. Enterprise pricing available on request.',
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
        <title>Latimere • Digital Identity + Credentials Rails</title>
        <meta
          name="description"
          content="Issue, store, and verify digital credentials with privacy-preserving sharing, revocation, and audit-ready evidence. Free wallet for individuals. Enterprise governance for issuers and verifiers."
        />

        {/* Canonical & robots */}
        <link rel="canonical" href={canonicalHref} />
        <meta name="robots" content="index,follow" />

        {/* Social cards */}
        <meta
          property="og:title"
          content="Latimere • Digital Identity + Credentials Rails"
        />
        <meta
          property="og:description"
          content="The trust fabric for credentials: issue → verify → revoke → audit. Free wallet + enterprise governance."
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
                    Digital Identity + Credentials Platform
                  </div>

                  <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                    The fabric for modern identity management
                  </h1>
                  <p className="mt-4 max-w-prose text-gray-200">
                    Issue, store, and verify credentials with privacy-preserving
                    sharing, lifecycle control (expire/revoke), and audit-ready
                    evidence—built for workforce, vendors, and regulated
                    industries.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <a
                      href="#contact"
                      className="inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                      onClick={() =>
                        console.info('[CTA] hero → Request enterprise demo clicked')
                      }
                    >
                      Request Enterprise Demo
                    </a>
                    <a
                      href="#wallet"
                      className="inline-flex justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      onClick={() => console.info('[CTA] hero → Explore wallet clicked')}
                    >
                      Explore Free Wallet
                    </a>
                    <a
                      href="#products"
                      className="inline-flex justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      onClick={() =>
                        console.info('[CTA] hero → See products clicked')
                      }
                    >
                      See product map
                    </a>
                  </div>

                  <ul className="mt-7 grid grid-cols-1 gap-3 text-gray-200 sm:grid-cols-3">
                    {[
                      'Issue + verify in seconds',
                      'Revocation + expiration built-in',
                      'Audit evidence by default',
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3">
                        <span className="mt-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-sm">{t}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-gray-300">
                    <span className="font-semibold text-gray-100">
                      Fast wedge:
                    </span>{' '}
                    workforce credentialing + vendor compliance for mid-market
                    enterprises (issue → verify → audit export).
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <h2 className="text-base font-semibold text-gray-100">
                    What Latimere replaces
                  </h2>
                  <p className="mt-2 text-sm text-gray-300">
                    PDFs, emails, shared drives, and manual checks—replaced with
                    real-time verification, revocation, and evidence trails.
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
                      <li>• Faster onboarding and fewer fraud events</li>
                      <li>• Less compliance overhead and cleaner audits</li>
                      <li>• Credential sharing that is privacy-first</li>
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
                  ['Issue', 'Credentials'],
                  ['Verify', 'Anywhere'],
                  ['Revoke', 'Instantly'],
                  ['Policy', 'Controls'],
                  ['Audit', 'Evidence'],
                  ['Scale', 'APIs'],
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

          {/* WALLET (FREE) */}
          <section
            id="wallet"
            data-section-id="wallet"
            className="border-t border-white/10 bg-white/[0.02]"
          >
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-gray-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Free tier
                  </div>

                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    A free wallet that makes verification effortless.
                  </h2>
                  <p className="mt-2 max-w-prose text-sm text-gray-300">
                    Hold credentials, share proofs with minimal disclosure, and
                    keep a personal verification history—without sending PDFs
                    around.
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {walletCards.map((s) => (
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
                      onClick={() => console.info('[CTA] wallet → Get started clicked')}
                    >
                      Get started
                    </a>
                    <a
                      href="#how"
                      className="inline-flex justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      onClick={() => console.info('[CTA] wallet → How it works clicked')}
                    >
                      How it works
                    </a>
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="text-sm font-semibold text-cyan-300">
                    Built for “prove it” moments
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {useCaseCards.map((u) => (
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
                    <h4 className="text-sm font-semibold">Why it scales</h4>
                    <ul className="mt-2 space-y-1 text-sm text-gray-300">
                      <li>• Issuers, holders, and verifiers reinforce each other</li>
                      <li>• Policy + audit create enterprise switching costs</li>
                      <li>• Marketplace services expand verification depth</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* PLATFORM FEATURES */}
          <section
            id="platform"
            data-section-id="platform"
            className="border-t border-white/10"
          >
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Enterprise-grade governance on day one
              </h2>
              <p className="mt-2 max-w-prose text-sm text-gray-300">
                Latimere is built for revocation, policy enforcement, and audit
                evidence—not just “store a credential.”
              </p>

              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {platformFeatureCards.map((f) => (
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
                  href="#products"
                  className="inline-flex justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  onClick={() => console.info('[CTA] platform → Product map clicked')}
                >
                  View Product map
                </a>
                <a
                  href="#contact"
                  className="inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                  onClick={() =>
                    console.info('[CTA] platform → Request demo clicked')
                  }
                >
                  Request a demo
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

          {/* 10-SKU PRODUCT MAP */}
          <section
            id="products"
            data-section-id="products"
            className="border-t border-white/10"
          >
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Product map
                  </h2>
                  <p className="mt-1 text-sm text-gray-300">
                    Free distribution + enterprise governance + marketplace
                    economics.
                  </p>
                </div>
                <a
                  href="#contact"
                  className="inline-flex justify-center rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                  onClick={() =>
                    console.info('[CTA] products → Talk to sales clicked')
                  }
                >
                  Talk to sales →
                </a>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {skuBuckets.map((b) => (
                  <div
                    key={b.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
                  >
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-gray-200">
                      <span
                        className={[
                          'h-1.5 w-1.5 rounded-full',
                          b.dotClass,
                        ].join(' ')}
                      />
                      {b.title}
                    </div>
                    <p className="text-sm text-gray-300">{b.desc}</p>

                    <div className="mt-5 space-y-3">
                      {b.items.map((i) => (
                        <div
                          key={i.name}
                          className="rounded-xl border border-white/10 bg-gray-950/40 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm font-semibold">{i.name}</div>
                              <div className="mt-1 text-sm text-gray-300">
                                {i.oneLiner}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="text-xs font-semibold text-cyan-300">
                                Pricing
                              </div>
                              <div className="text-xs text-gray-300">{i.pricing}</div>
                            </div>
                          </div>
                          {i.notes && (
                            <div className="mt-2 text-xs text-gray-400">
                              {i.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h3 className="text-base font-semibold">
                  Pricing starter pack
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {v1Pricing.map((p) => (
                    <div
                      key={p.title}
                      className="rounded-xl border border-white/10 bg-gray-950/40 p-4"
                    >
                      <div className="text-sm font-semibold">{p.title}</div>
                      <div className="mt-1 text-sm text-gray-300">{p.price}</div>
                      <div className="mt-2 text-xs text-gray-400">{p.desc}</div>
                    </div>
                  ))}
                </div>
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
                The platform is designed so policies and evidence are first-class
                citizens—critical for regulated workflows and enterprise trust.
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
                    console.info('[CTA] security → Request security overview clicked')
                  }
                >
                  Request security overview
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
                  body="Discuss credentialing workflows, verification patterns, and implementation lessons."
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
                    Request a demo or join the early access list
                  </h2>
                  <p className="mt-2 text-sm text-gray-300">
                    Tell us what you’re trying to prove (workforce, vendors, access,
                    compliance) and we’ll reply with next steps.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-300">
                    <li>• Same-day response</li>
                    <li>• Free wallet tier for individuals</li>
                    <li>• Enterprise governance for issuers and verifiers</li>
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

const replaceCards = [
  {
    kicker: 'Before',
    title: 'PDFs and screenshots',
    desc: 'Credentials passed around via email and chat, hard to verify and easy to forge.',
  },
  {
    kicker: 'Before',
    title: 'Manual checks',
    desc: 'Teams repeatedly re-check the same documents without reliable revocation signals.',
  },
  {
    kicker: 'After',
    title: 'Live verification',
    desc: 'Verifiers confirm validity in real time with policy rules and trust lists.',
  },
  {
    kicker: 'After',
    title: 'Audit evidence',
    desc: 'Every issuance, verification, and decision is exportable for audits and incident reviews.',
  },
]

const walletCards = [
  {
    kicker: 'Share',
    title: 'One-click proof sharing',
    desc: 'Present credentials via link or QR and share only what is needed for the situation.',
  },
  {
    kicker: 'Control',
    title: 'Revocation-aware',
    desc: 'Stop relying on stale documents. Verifiers get status from the source of truth.',
  },
  {
    kicker: 'History',
    title: 'Personal verification log',
    desc: 'See where and when you verified or shared a credential (useful for disputes).',
  },
  {
    kicker: 'Renewals',
    title: 'Expiration reminders',
    desc: 'Get notified before credentials lapse so you stay eligible and compliant.',
  },
]

const useCaseCards = [
  {
    title: 'Workforce onboarding',
    desc: 'Eligibility, training, and role-based access checks without PDFs.',
  },
  {
    title: 'Vendor compliance',
    desc: 'Insurance, safety training, and compliance attestations with audit trails.',
  },
  {
    title: 'Certifications and licenses',
    desc: 'Issue and verify qualifications with revocation and expiration support.',
  },
  {
    title: 'Access badges and permissions',
    desc: 'Gate physical/digital access based on current credential status.',
  },
]

const platformFeatureCards = [
  {
    kicker: 'Lifecycle',
    title: 'Issuance + revocation + expiration',
    desc: 'Manage credential status at scale with predictable lifecycle rules.',
  },
  {
    kicker: 'Policy',
    title: 'Verifier policy engine',
    desc: 'Define acceptance requirements (issuer trust, freshness, schema, assurance tier).',
  },
  {
    kicker: 'Evidence',
    title: 'Audit packs by default',
    desc: 'Immutable logs and exportable proof of who verified what, when, and under what rules.',
  },
  {
    kicker: 'Integrations',
    title: 'APIs + webhooks',
    desc: 'Embed verification in portals and workflows; trigger events downstream reliably.',
  },
  {
    kicker: 'Trust',
    title: 'Trust registries (issuer allowlists)',
    desc: 'Control who can issue what in your ecosystem; support accreditation programs over time.',
  },
  {
    kicker: 'Scale',
    title: 'Enterprise controls',
    desc: 'SSO, roles, key rotation, and environment separation designed for procurement.',
  },
]

const howItWorksSteps = [
  {
    step: 1,
    title: 'Issuers issue credentials',
    desc: 'Employers, schools, and vendors issue digital credentials under defined schemas.',
  },
  {
    step: 2,
    title: 'Holders store and share',
    desc: 'Individuals store credentials in a wallet and present proofs when needed.',
  },
  {
    step: 3,
    title: 'Verifiers verify instantly',
    desc: 'Verification happens via web, QR, or API using policy rules and trust lists.',
  },
  {
    step: 4,
    title: 'Evidence is audit-ready',
    desc: 'Logs and receipts produce exports for audits, compliance, and incident response.',
  },
]

const skuBuckets = [
  {
    title: 'Free / PLG',
    dotClass: 'bg-emerald-400',
    desc: 'Drive adoption with a free wallet + easy verification endpoints.',
    items: [
      {
        name: 'Personal Trust Wallet (Free)',
        oneLiner: 'Store credentials, share proofs, and track personal verification history.',
        pricing: 'Free',
        notes: 'Distribution engine: makes Latimere the default “prove it” workflow.',
      },
      {
        name: 'Verifier Starter Kit (Free)',
        oneLiner: 'Hosted verify page + basic API key + QR verification flow.',
        pricing: 'Free',
        notes: 'Embeddable verification everywhere. Converts verifiers into issuers.',
      },
    ],
  },
  {
    title: 'SMB / Self-serve',
    dotClass: 'bg-cyan-400',
    desc: 'Lightweight issuing for small teams and training providers.',
    items: [
      {
        name: 'Wallet Pro',
        oneLiner: 'Advanced controls, device sync, exports, and priority recovery.',
        pricing: '$6–$12/user/month',
      },
      {
        name: 'Issuer Lite',
        oneLiner: 'Issue credentials with templates, revocation, and basic reporting.',
        pricing: '$199–$499/month',
        notes: 'Great for small employers, training orgs, and niche credential issuers.',
      },
    ],
  },
  {
    title: 'Enterprise core',
    dotClass: 'bg-indigo-400',
    desc: 'Governance, policies, audit evidence, and scale controls.',
    items: [
      {
        name: 'Credential Governance Cloud',
        oneLiner: 'Tenant admin, policy engine, lifecycle automation, and audit exports.',
        pricing: '$25k–$150k/year + usage',
      },
      {
        name: 'Workforce Compliance Suite',
        oneLiner: 'Onboarding flows, contractor credentialing, vendor compliance, reminders.',
        pricing: '$2–$6/worker/year + platform fee',
      },
      {
        name: 'Verifier API at Scale',
        oneLiner: 'High-volume verification with SLAs, tiers, and risk/fraud signals.',
        pricing: '$0.05–$0.50/verification + minimum commit',
      },
      {
        name: 'Authorization & Access',
        oneLiner: 'Gate access decisions based on credential status (zero-trust patterns).',
        pricing: '$3–$10/seat/month or per integration',
      },
    ],
  },
  {
    title: 'Ecosystem / Marketplace',
    dotClass: 'bg-fuchsia-400',
    desc: 'Platform economics via third-party verification services and trust frameworks.',
    items: [
      {
        name: 'Verification Marketplace',
        oneLiner: 'License checks, background attestations, education verification add-ons.',
        pricing: '10–25% take rate',
      },
      {
        name: 'Trust Registry & Accreditation',
        oneLiner: 'Who can issue what; assurance tiers; issuer accreditation programs.',
        pricing: '$5k–$100k/year depending on tier',
      },
    ],
  },
]

const v1Pricing = [
  {
    title: 'Issuer Lite',
    price: '$299/month (starter)',
    desc: 'Includes a basic issuance quota. Designed for fast self-serve conversion.',
  },
  {
    title: 'Verifier API',
    price: '$0.10/verification + $500/month minimum',
    desc: 'Tier down with volume. Add SLAs and assurance tiers for enterprise.',
  },
  {
    title: 'Enterprise Governance',
    price: 'From $25k/year',
    desc: 'SSO, policies, audit packs, key management, and enterprise controls.',
  },
]

const securityCards = [
  {
    kicker: 'Privacy',
    title: 'Minimal disclosure by design',
    desc: 'Share only what’s required for the verifier’s policy, not an entire document.',
  },
  {
    kicker: 'Integrity',
    title: 'Credential lifecycle control',
    desc: 'Expiration and revocation are core; verifiers can confirm status at verification time.',
  },
  {
    kicker: 'Audit',
    title: 'Evidence-first logging',
    desc: 'Structured logs and receipts make audits and investigations dramatically easier.',
  },
  {
    kicker: 'Enterprise',
    title: 'SSO + role-based access',
    desc: 'Support enterprise access control for issuer and verifier administration workflows.',
  },
  {
    kicker: 'Keys',
    title: 'Key rotation + separation',
    desc: 'Design for key hygiene early (rotation and separation of responsibilities).',
  },
  {
    kicker: 'Scale',
    title: 'API governance',
    desc: 'Rate limiting and usage controls for verification endpoints and integrations.',
  },
]

const faqItems: [string, string][] = [
  [
    'Is this a wallet only?',
    'No. The wallet is the distribution layer. The enterprise platform adds issuance, policies, revocation, and audit evidence.',
  ],
  [
    'What’s the fastest initial use case?',
    'Workforce credentialing + vendor compliance for mid-market: one product that covers issue → verify → audit export.',
  ],
  [
    'Do you support revocation and expiration?',
    'Yes. Credential lifecycle is first-class so verifiers can avoid relying on stale documents.',
  ],
  [
    'How do verifiers integrate?',
    'Via a hosted verification page, QR flows, or an API—governed by a policy engine and trust lists.',
  ],
  [
    'How do audits work?',
    'Issuance and verification generate receipts and logs that can be exported for compliance and incident response.',
  ],
  [
    'Is there a marketplace?',
    'The roadmap includes a verification marketplace where third parties can sell verification add-ons and services.',
  ],
]

/* ---------- form components ---------- */

function LeadForm() {
  type Mode = 'enterprise' | 'wallet'
  type Status = 'idle' | 'submitting' | 'success' | 'error'

  const router = useRouter()

  const [mode, setMode] = React.useState<Mode>('enterprise')
  const [status, setStatus] = React.useState<Status>('idle')
  const [message, setMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    const qMode = router.query?.mode
    const modeVal = Array.isArray(qMode) ? qMode[0] : qMode

    if (modeVal === 'wallet' || modeVal === 'enterprise') {
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
  const [employeeCount, setEmployeeCount] = React.useState('')
  const [useCase, setUseCase] = React.useState('')
  const [region, setRegion] = React.useState('')
  const [currentProcess, setCurrentProcess] = React.useState('')

  // Wallet fields
  const [walletGoal, setWalletGoal] = React.useState('')

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
      if (!company || !useCase || !employeeCount) {
        console.warn('[LeadForm] missing enterprise fields', {
          company,
          useCase,
          employeeCount,
        })
        setStatus('error')
        setMessage('Please add company name, use case, and employee count.')
        return
      }
    } else {
      if (!walletGoal) {
        console.warn('[LeadForm] missing walletGoal')
        setStatus('error')
        setMessage('Please tell us what you want to use the wallet for.')
        return
      }
    }

    const payload = {
      name,
      phone,
      email,
      mode,
      topic: mode === 'enterprise' ? 'Enterprise Demo Request' : 'Wallet Early Access',
      enterprise:
        mode === 'enterprise'
          ? {
              company,
              employeeCount,
              useCase,
              region,
              currentProcess,
            }
          : null,
      wallet:
        mode === 'wallet'
          ? {
              walletGoal,
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
            mode === 'enterprise' ? 'identity_enterprise_demo' : 'identity_wallet_early_access'
          )
        } catch {}

        setStatus('success')
        setMessage(
          mode === 'enterprise'
            ? "Thanks! We'll reach out shortly to schedule your demo."
            : "Thanks! You're on the early access list."
        )

        setName('')
        setEmail('')
        setPhone('')

        setCompany('')
        setEmployeeCount('')
        setUseCase('')
        setRegion('')
        setCurrentProcess('')

        setWalletGoal('')
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
    <form
      onSubmit={onSubmit}
      className="space-y-6"
      aria-label="Lead form"
    >
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
          Enterprise demo
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('wallet')
            console.info('[LeadForm] mode set → wallet')
          }}
          className={[
            'rounded-lg border px-3 py-2 text-sm font-medium',
            mode === 'wallet'
              ? 'border-cyan-400 bg-cyan-500 text-gray-900'
              : 'border-white/15 bg-white/5 text-gray-100 hover:bg-white/10',
          ].join(' ')}
          aria-pressed={mode === 'wallet'}
        >
          Free wallet access
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

          <Field
            id="l-emp"
            label="Employee/contractor count *"
            value={employeeCount}
            onChange={setEmployeeCount}
            placeholder="250"
            inputMode="numeric"
          />

          <Field
            id="l-region"
            label="Primary region"
            value={region}
            onChange={setRegion}
            placeholder="US / EU / Global"
          />

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-gray-100" htmlFor="l-usecase">
              Primary use case *
            </label>
            <select
              id="l-usecase"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-gray-900 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
            >
              <option value="">Select</option>
              <option value="workforce_onboarding">Workforce onboarding</option>
              <option value="vendor_compliance">Vendor compliance</option>
              <option value="certifications_licensing">Certifications / licensing</option>
              <option value="access_authorization">Access authorization</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <Field
              id="l-process"
              label="Current process (optional)"
              value={currentProcess}
              onChange={setCurrentProcess}
              placeholder="PDFs, spreadsheets, email, GRC tool, custom portal..."
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <Field
            id="l-wallet-goal"
            label="What do you want to use the wallet for? *"
            value={walletGoal}
            onChange={setWalletGoal}
            placeholder="Share certifications, prove eligibility, vendor badge, etc."
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
            ? 'Request Demo'
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

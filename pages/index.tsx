// pages/index.tsx
import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
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
    console.error('❌ getStaticProps failed to load blog posts:', err)
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
    refer: false,
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

  const prefetchRefer = React.useCallback(() => {
    if (!prefetchOnce.current.refer) {
      router.prefetch('/refer').catch(() => {})
      prefetchOnce.current.refer = true
      console.info('[Prefetch] /refer')
    }
  }, [router])

  // Build canonical (SSR-safe). If NEXT_PUBLIC_APP_URL is missing, this will be relative in dev.
  const appUrlEnv = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const canonicalHref = appUrlEnv ? `${appUrlEnv}/` : '/'

  // Hero image: prefer cabin; if missing, fall back.
  const [heroSrc, setHeroSrc] = React.useState('/images/cabin-hero.jpg')
  const onHeroError = React.useCallback(() => {
    console.warn(
      '[Hero] failed:',
      heroSrc,
      '→ fallback to /images/cabin-exterior-01.jpg'
    )
    setHeroSrc('/images/cabin-exterior-01.jpg')
  }, [heroSrc])

  // JSON-LD (Organization + LocalBusiness)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Latimere',
    image: '/og.png',
    url: appUrlEnv || 'https://latimere.com',
    telephone: '+1-865-000-0000',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Gatlinburg',
      addressRegion: 'TN',
      addressCountry: 'US',
    },
    areaServed: ['Gatlinburg', 'Pigeon Forge', 'Sevierville'],
    sameAs: ['https://www.facebook.com/', 'https://www.instagram.com/'],
    makesOffer: [
      { '@type': 'Offer', name: 'Short-term rental management' },
      { '@type': 'Offer', name: 'Cohosting' },
    ],
  }

  return (
    <>
      <Head>
        <title>Latimere • Short-Term Rental Management</title>
        <meta
          name="description"
          content="Done-for-you Airbnb operations in the Smokies — listings, pricing, turnover, guest messaging, maintenance, and transparent reporting."
        />

        {/* Canonical & robots */}
        <link rel="canonical" href={canonicalHref} />
        <meta name="robots" content="index,follow" />

        {/* Social cards */}
        <meta
          property="og:title"
          content="Latimere • Short-Term Rental Management"
        />
        <meta
          property="og:description"
          content="Done-for-you Airbnb operations in the Smokies — listings, pricing, turnover, guest messaging, maintenance, and transparent reporting."
        />
        <meta property="og:image" content="/og.png" />
        <meta property="og:url" content={canonicalHref} />
        <meta name="twitter:card" content="summary_large_image" />

        {/* Favicons (cache-busted) */}
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

        {/* Preload hero for faster first paint */}
        <link
          rel="preload"
          as="image"
          href={heroSrc}
          imagesrcset="/images/cabin-hero.jpg 1600w, /images/cabin-exterior-01.jpg 1600w"
          imagesizes="100vw"
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
        {/* Shared header/nav (same as blog pages) */}
        <TopNav />

        {/* HERO */}
        <main id="main">
          <section data-section-id="hero" className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.25),transparent_60%)]"
            />
            <div className="relative isolate">
              <div className="relative h-[60vh] w-full sm:h-[72vh]">
                <Image
                  src={heroSrc}
                  alt="Mountain cabin living room with expansive view"
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                  onLoadingComplete={() =>
                    console.info('[Hero] loaded', heroSrc)
                  }
                  onError={onHeroError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 to-transparent" />
              </div>

              <div className="mx-auto -mt-32 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
                <div className="max-w-2xl rounded-2xl border border-white/10 bg-gray-950/70 p-6 backdrop-blur">
                  <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                    Full-service Airbnb Management in the Smokies
                  </h1>
                  <p className="mt-3 text-gray-200">
                    We handle listings, pricing, cleanings, guest messaging, and
                    maintenance 24/7 so you don&apos;t have to.
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link
                      href="/#contact"
                      className="inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                      onClick={() =>
                        console.info('[CTA] hero → Get a Free Quote')
                      }
                    >
                      Get a Free Quote
                    </Link>
                    <a
                      href="#services"
                      className="inline-flex justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    >
                      See what’s included
                    </a>
                    <Link
                      href="/refer"
                      className="inline-flex justify-center rounded-lg border border-cyan-400 bg-transparent px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                      onMouseEnter={prefetchRefer}
                      onFocus={prefetchRefer}
                      onClick={() =>
                        console.info('[CTA] hero → Realtor Refer Client')
                      }
                    >
                      I’m a Realtor – Refer a Client
                    </Link>
                  </div>

                  <ul className="mt-6 grid grid-cols-1 gap-3 text-gray-200 sm:grid-cols-3">
                    {[
                      'Dynamic pricing & revenue optimization',
                      '24/7 guest messaging & screening',
                      'Cleanings, inspections & supplies',
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3">
                        <span className="mt-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-sm">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* TRUST STRIP */}
          <section data-section-id="trust" className="border-t border-white/10">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
                {[
                  ['24/7', 'Guest Support'],
                  ['80%', 'Owner Earnings'],
                  ['+32%', 'Increased Revenue'],
                  ['100%', 'Local Team'],
                  ['< 1h', 'Avg Guest Response'],
                  ['A+', 'Cleanliness'],
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

          {/* REALTOR REFERRAL SECTION */}
          <section
            id="realtors"
            data-section-id="realtors"
            className="border-t border-white/10 bg-cyan-500/5"
          >
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    For Real Estate Agents
                  </h2>
                  <p className="mt-2 max-w-prose text-sm text-gray-200">
                    Have a buyer closing on a Smokies cabin? Send them to
                    Latimere in under 30 seconds. We&apos;ll handle pricing,
                    onboarding, and operations—and you&apos;ll earn a{' '}
                    <span className="font-semibold">$500 referral bonus</span>{' '}
                    once their first payout clears.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-200">
                    <li>• Simple form—just your info and your client’s info</li>
                    <li>• We keep you updated on onboarding progress</li>
                    <li>• No obligation for your client; no spam</li>
                  </ul>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/refer"
                      className="inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                      onMouseEnter={prefetchRefer}
                      onFocus={prefetchRefer}
                      onClick={() =>
                        console.info(
                          '[CTA] refer-section → Send a Referral clicked'
                        )
                      }
                    >
                      Send a Referral
                    </Link>
                    <Link
                      href="/refer/status"
                      className="inline-flex justify-center rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      onClick={() =>
                        console.info(
                          '[CTA] refer-section → View My Referrals clicked'
                        )
                      }
                    >
                      View my referral status
                    </Link>
                  </div>
                  <p className="mt-2 text-xs text-gray-300">
                    We&apos;ll never use your client&apos;s information for
                    anything other than contacting them about Latimere Hosting.
                  </p>
                </div>
                <div className="rounded-2xl border border-cyan-500/30 bg-gray-950/80 p-5 text-sm text-gray-200 shadow-lg">
                  <h3 className="text-sm font-semibold text-cyan-300">
                    How it works
                  </h3>
                  <ol className="mt-3 space-y-2 text-sm">
                    <li>
                      <span className="font-semibold">1.</span> Submit your
                      client using the{' '}
                      <span className="font-semibold">Realtor Referral</span>{' '}
                      form.
                    </li>
                    <li>
                      <span className="font-semibold">2.</span> Your client
                      receives a branded onboarding link and we connect
                      directly.
                    </li>
                    <li>
                      <span className="font-semibold">3.</span> You can track
                      progress and bonus status with your magic-link dashboard.
                    </li>
                    <li>
                      <span className="font-semibold">4.</span> After their
                      first payout clears, we send your{' '}
                      <span className="font-semibold">$500 referral bonus.</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </section>

          {/* SERVICES */}
          <section
            id="services"
            data-section-id="services"
            className="border-t border-white/10"
          >
            <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  We provide everything needed for top-performing listings
                </h2>
                <p className="mt-2 max-w-prose text-sm text-gray-300">
                  Owners choose Latimere for proactive, transparent operations
                  that give guests an exceptional experience and maximize your
                  returns.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {serviceList.map((s) => (
                    <div
                      key={s.title}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="text-xl" aria-hidden>
                        {s.icon}
                      </div>
                      <h3 className="mt-2 text-base font-semibold">
                        {s.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-300">{s.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <a
                    href="#contact"
                    className="inline-flex rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                    onClick={() =>
                      console.info('[CTA] services → Quote clicked')
                    }
                  >
                    Get my free revenue estimate
                  </a>
                </div>
              </div>

              {/* Lifestyle photo */}
              <div className="relative h-80 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] md:h-[28rem]">
                <Image
                  src="/images/cabin-living-01.jpg"
                  alt="Bright living room with mountain view"
                  fill
                  sizes="(min-width:1024px) 48vw, 100vw"
                  className="object-cover"
                  onLoadingComplete={() =>
                    console.info('[Img] services photo loaded')
                  }
                  onError={(e) =>
                    console.warn('[Img] services photo failed', e)
                  }
                />
              </div>
            </div>
          </section>

          {/* OPERATIONS */}
          <section
            id="operations"
            data-section-id="operations"
            className="border-t border-white/10 bg-white/[0.02]"
          >
            <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
              <div className="relative order-last h-80 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] md:h-[28rem] lg:order-first">
                <Image
                  src="/images/cabin-exterior-02.jpg"
                  alt="Cozy porch at sunset"
                  fill
                  sizes="(min-width:1024px) 48vw, 100vw"
                  className="object-cover"
                  onLoadingComplete={() =>
                    console.info('[Img] operations lifestyle loaded')
                  }
                  onError={(e) =>
                    console.warn('[Img] operations lifestyle failed', e)
                  }
                />
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Clear reporting & Owner access
                </h2>
                <p className="mt-2 max-w-prose text-sm text-gray-300">
                  See bookings, payouts, work orders, and cleanings in one
                  place, without hunting across logins.
                </p>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <Image
                    src="/images/dashboard-demo.png"
                    alt="Latimere operations dashboard"
                    width={1400}
                    height={900}
                    className="h-auto w-full rounded-xl border border-white/10"
                    onLoadingComplete={() =>
                      console.info('[Img] dashboard loaded')
                    }
                    onError={(e) =>
                      console.warn('[Img] dashboard failed', e)
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {/* BLOG HIGHLIGHTS */}
          <section
            id="blog"
            data-section-id="blog"
            className="border-t border-white/10"
          >
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Latest from the Blog
                  </h2>
                  <p className="mt-1 text-sm text-gray-300">
                    Practical posts you can share with guests, owners, and
                    partners.
                  </p>
                </div>
                <Link
                  href="/blog"
                  className="hidden rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 sm:inline"
                  onMouseEnter={prefetchBlog}
                  onFocus={prefetchBlog}
                >
                  View all posts →
                </Link>
              </div>

              {latestPosts?.length ? (
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {latestPosts.map((p) => (
                    <article
                      key={p.slug}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-sm"
                    >
                      <Link
                        href={`/blog/${p.slug}`}
                        onMouseEnter={prefetchBlog}
                        onFocus={prefetchBlog}
                      >
                        <div className="relative h-48 w-full">
                          <Image
                            src={
                              p.coverImage || '/images/cabin-exterior-01.jpg'
                            }
                            alt={p.title}
                            fill
                            sizes="(min-width:1024px) 33vw, 100vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            onLoadingComplete={() =>
                              console.info('[BlogCard] hero loaded', p.slug)
                            }
                            onError={(e) =>
                              console.warn(
                                '[BlogCard] hero failed',
                                p.slug,
                                e
                              )
                            }
                          />
                        </div>
                        <div className="p-4">
                          <div className="text-[11px] text-gray-400">
                            {p.date} · {p.author || 'Latimere Team'}
                          </div>
                          <h3 className="mt-1 line-clamp-2 text-base font-semibold text-white">
                            {p.title}
                          </h3>
                          {p.excerpt && (
                            <p className="mt-1 line-clamp-2 text-sm text-gray-300">
                              {p.excerpt}
                            </p>
                          )}
                          <div className="mt-3 text-sm font-medium text-cyan-400">
                            Read post →
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
                  No blog posts yet. Add markdown files to{' '}
                  <code className="font-mono">content/blog/</code>.
                </div>
              )}

              {/* Mobile "view all" */}
              <div className="mt-6 sm:hidden">
                <Link
                  href="/blog"
                  className="inline-block rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                  onMouseEnter={prefetchBlog}
                >
                  View all posts →
                </Link>
              </div>
            </div>
          </section>

          {/* (Optional) COMMUNITY CTA */}
          {ENABLE_COMMUNITY && CommunityCTA && (
            <section
              data-section-id="community"
              className="border-t border-white/10"
            >
              <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <CommunityCTA
                  title="Join the Latimere Community"
                  body="Ask questions, share tips, and learn from STR owners in the Smokies."
                  buttonLabel="Visit Community"
                  href="/community?utm_source=landing&utm_medium=banner&utm_campaign=community"
                  eventLabel="landing_banner_community"
                  variant="outline"
                  onClick={() =>
                    console.info('[CTA] community → banner clicked')
                  }
                  onMouseEnter={prefetchCommunity}
                />
              </div>
            </section>
          )}

          {/* GALLERY */}
          <section
            id="gallery"
            data-section-id="gallery"
            className="border-t border-white/10"
          >
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Property Gallery
              </h2>
              <p className="mt-2 max-w-prose text-sm text-gray-300">
                A feel for the standard we maintain across interiors and
                exteriors.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
                {galleryImages.map((g) => (
                  <figure
                    key={g.src}
                    className="relative h-48 overflow-hidden rounded-xl border border-white/10 md:h-64"
                  >
                    <Image
                      src={g.src}
                      alt={g.alt}
                      fill
                      sizes="(min-width:1024px) 360px, (min-width:640px) 33vw, 50vw"
                      className="object-cover"
                      onLoadingComplete={() =>
                        console.info('[Gallery] loaded', g.src)
                      }
                      onError={(e) =>
                        console.warn('[Gallery] failed', g.src, e)
                      }
                    />
                  </figure>
                ))}
              </div>
            </div>
          </section>

          {/* TESTIMONIAL */}
          <section
            data-section-id="testimonial"
            className="border-t border-white/10 bg-white/[0.02]"
          >
            <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
              <div className="relative h-72 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                <Image
                  src="/images/cabin-exterior-01.jpg"
                  alt="Cabin exterior with mountain view"
                  fill
                  sizes="(min-width:1024px) 48vw, 100vw"
                  className="object-cover"
                />
              </div>
              <blockquote className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center lg:text-left">
                <p className="text-xl font-semibold sm:text-2xl">
                  “Latimere’s partnership increased my revenue by 32% per
                  month.”
                </p>
                <footer className="mt-2 text-sm text-gray-300">
                  — Mark Thomas, Smokies Real Estate Investor
                </footer>
              </blockquote>
            </div>
          </section>

          {/* CTA CARD / CONTACT */}
          <section
            id="contact"
            data-section-id="contact"
            className="border-t border-white/10"
          >
            <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 items-start gap-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur sm:p-8 lg:grid-cols-2">
                <div className="self-start">
                  <h2 className="text-xl font-semibold">
                    Get your Free Revenue Estimate Today!
                  </h2>
                  <p className="mt-2 text-sm text-gray-300">
                    Tell us about your rentals and our local team will reply the
                    same day with next steps.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-300">
                    <li>• Same-day response</li>
                    <li>• No commitment</li>
                    <li>
                      • Local team in Gatlinburg, Pigeon Forge &amp; Sevierville
                    </li>
                  </ul>
                </div>
                <div className="self-start">
                  <QuoteForm />
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

        {/* Shared footer */}
        <SiteFooter />
      </div>
    </>
  )
}

/* ---------- content data ---------- */

const serviceList = [
  {
    icon: '📝',
    title: 'Listing & Channel Setup',
    desc: 'High-conversion listings and distribution across Airbnb & Vrbo.',
  },
  {
    icon: '💬',
    title: '24/7 Guest Messaging',
    desc: 'Fast, friendly responses across the entire stay.',
  },
  {
    icon: '🧹',
    title: 'Turnovers & Inspections',
    desc: 'Photos, supplies, and quality control.',
  },
  {
    icon: '📈',
    title: 'Dynamic Pricing',
    desc: 'Seasonality, lead-time, and demand adjustments to lift revenue & occupancy.',
  },
  {
    icon: '📷',
    title: 'Pro Photography',
    desc: 'Scroll-stopping photos that increase clicks and bookings.',
  },
  {
    icon: '📊',
    title: 'Owner Reporting',
    desc: 'Revenue, occupancy, payouts, and work orders—always current.',
  },
  {
    icon: '🛠️',
    title: 'Maintenance',
    desc: 'Trusted local vendors and proactive upkeep.',
  },
  {
    icon: '🛡️',
    title: 'Compliance',
    desc: 'Permitting guidance for local laws.',
  },
]

const galleryImages = [
  { src: '/images/cabin-living-01.jpg', alt: 'Living room with mountain view' },
  { src: '/images/cabin-kitchen-01.jpg', alt: 'Modern cabin kitchen' },
  { src: '/images/cabin-exterior-01.jpg', alt: 'Cabin exterior at golden hour' },
  { src: '/images/cabin-bedroom-king-01.jpg', alt: 'King bedroom' },
  { src: '/images/cabin-bathroom-01.jpg', alt: 'Bathroom' },
  { src: '/images/cabin-exterior-02.jpg', alt: 'Cozy porch at sunset' },
]

const faqItems: [string, string][] = [
  [
    'Do you work with single or multiple units?',
    'Both. We tailor pricing to your portfolio size, property type, and goals.',
  ],
  [
    'How do I track performance?',
    'You’ll get clear reporting on bookings, payouts, and key metrics, and we’re always a text or call away.',
  ],
  [
    'Which markets do you serve?',
    'We currently focus on Gatlinburg, Pigeon Forge, and Sevierville in the Smokies.',
  ],
  [
    'How is pricing structured?',
    'We typically work on a simple percentage of revenue. We’ll walk through options on your intro call.',
  ],
  [
    'I’m a realtor—how do I refer clients?',
    'Use the “I’m a Realtor – Refer a Client” button on this page or visit latimere.com/refer to submit your client in under 30 seconds.',
  ],
  [
    'Do you manage existing listings?',
    'Yes. We can take over existing Airbnb/Vrbo listings, optimize them, and plug them into our local operations.',
  ],
]

/* ---------- form components ---------- */

function QuoteForm() {
  type Service = 'airbnb'
  type Status = 'idle' | 'submitting' | 'success' | 'error'
  const router = useRouter()
  const [service, setService] = React.useState<Service>('airbnb')
  const [status, setStatus] = React.useState<Status>('idle')
  const [message, setMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    const q = router.query?.service
    const val = Array.isArray(q) ? q[0] : q
    if (val && val !== 'airbnb') {
      console.warn(
        "[QuoteForm] unsupported service in query → coercing to 'airbnb'",
        { requested: val }
      )
    }
    setService('airbnb')
  }, [router.query?.service])

  // Fields
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [listedBefore, setListedBefore] = React.useState<'yes' | 'no' | ''>('')
  const [sqft, setSqft] = React.useState('')
  const [sleeps, setSleeps] = React.useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setMessage(null)

    if (!name || !email) {
      console.warn('[QuoteForm] missing name/email')
      setStatus('error')
      setMessage('Please provide at least your name and email.')
      return
    }
    if (!address || !sleeps) {
      console.warn('[QuoteForm] missing address/sleeps')
      setStatus('error')
      setMessage('Please add your property address and how many it sleeps.')
      return
    }

    const payload = {
      name,
      phone,
      email,
      service,
      topic: 'Airbnb Management Lead',
      airbnb: { address, listedBefore, squareFootage: sqft, sleeps },
      meta: { page: 'landing', ts: Date.now() },
    }

    try {
      console.info('📝 Submitting → /api/contact', payload)
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await safeJson(res)
      if (res.ok) {
        console.info('✅ Lead submitted', { response: data })
        try {
          ;(window as any).latimereTrackLead?.('landing_quote')
        } catch {}
        setStatus('success')
        setMessage("Thanks! We'll be in touch shortly.")
        setName('')
        setPhone('')
        setEmail('')
        setAddress('')
        setListedBefore('')
        setSqft('')
        setSleeps('')
      } else {
        console.error('❌ Lead failed', { status: res.status, data })
        setStatus('error')
        setMessage(
          (data as any)?.dev?.message ||
            'We couldn’t submit your request. Please try again shortly.'
        )
      }
    } catch (err) {
      console.error('❌ Lead network error', err)
      setStatus('error')
      setMessage(
        'We couldn’t submit your request. Please try again shortly.'
      )
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6"
      aria-label="Request a quote form"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setService('airbnb')}
          className="rounded-lg border border-cyan-400 bg-cyan-500 px-3 py-2 text-sm font-medium text-gray-900"
          aria-pressed={true}
        >
          Airbnb property
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="q-name"
          label="Your Name *"
          value={name}
          onChange={setName}
          placeholder="Jordan Taylor"
        />
        <Field
          id="q-phone"
          label="Phone Number"
          value={phone}
          onChange={setPhone}
          placeholder="(555) 123-4567"
          inputMode="tel"
        />
        <div className="sm:col-span-2">
          <Field
            id="q-email"
            label="Email Address *"
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
            inputMode="email"
            type="email"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            id="q-address"
            label="Property Address *"
            value={address}
            onChange={setAddress}
            placeholder="123 Main St, City, ST"
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm text-gray-100"
            htmlFor="q-listed"
          >
            Previously listed as STR?
          </label>
          <select
            id="q-listed"
            value={listedBefore}
            onChange={(e) => setListedBefore(e.target.value as any)}
            className="w-full rounded-lg border border-white/15 bg-gray-900 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <Field
          id="q-sqft"
          label="Square Footage"
          value={sqft}
          onChange={setSqft}
          placeholder="1600"
          inputMode="numeric"
        />
        <Field
          id="q-sleeps"
          label="Sleeps *"
          value={sleeps}
          onChange={setSleeps}
          placeholder="6"
          inputMode="numeric"
        />
      </div>

      {message && (
        <div
          className={[
            'rounded-lg px-3 py-2 text-sm',
            status === 'error'
              ? 'bg-red-500/15 text-red-300 border border-red-500/30'
              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
          ].join(' ')}
          role={status === 'error' ? 'alert' : 'status'}
        >
          {message}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 disabled:opacity-60"
          onClick={() =>
            console.info('[CTA] contact → Request Quote clicked')
          }
        >
          {status === 'submitting' ? 'Sending…' : 'Request Quote'}
        </button>
        <a
          href="mailto:taylor@latimere.com"
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

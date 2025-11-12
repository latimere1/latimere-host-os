// pages/blog/index.tsx
import React, { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import type { GetStaticProps } from 'next'
import { useRouter } from 'next/router'

import TopNav from '../../components/TopNav'
import { getAllPosts, type BlogPost } from '../../lib/blog'

type Props = { posts: BlogPost[] }

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    const posts = getAllPosts()
    if (process.env.NODE_ENV !== 'production') {
      console.info('[blog/index.getStaticProps] slugs:', posts.map(p => p.slug))
    }
    return { props: { posts } }
  } catch (err) {
    console.error('❌ [blog/index.getStaticProps] failed:', err)
    return { props: { posts: [] } }
  }
}

export default function BlogIndex({ posts }: Props) {
  const router = useRouter()
  const appUrlEnv = process.env.NEXT_PUBLIC_APP_URL ?? ''

  // Resolve canonical/share URL safely
  const [clientOrigin, setClientOrigin] = useState('')
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setClientOrigin(window.location.origin)
      if (!appUrlEnv) {
        console.warn('[BlogIndex] NEXT_PUBLIC_APP_URL not set; falling back to window.location.origin', {
          origin: window.location.origin,
        })
      }
    }
  }, [appUrlEnv])

  const canonicalUrl = useMemo(() => {
    if (appUrlEnv) return `${appUrlEnv}/blog`
    if (clientOrigin) return `${clientOrigin}/blog`
    return '/blog'
  }, [appUrlEnv, clientOrigin])

  useEffect(() => {
    console.info('[BlogIndex] mounted', { path: router.asPath, count: posts.length, canonicalUrl })
  }, [router.asPath, posts.length, canonicalUrl])

  // Prefetch individual posts on hover/focus for snappier UX
  const prefetchOnce = React.useRef<Record<string, boolean>>({})
  function prefetchPost(slug: string) {
    if (prefetchOnce.current[slug]) return
    router.prefetch(`/blog/${slug}`).catch(() => {})
    prefetchOnce.current[slug] = true
    console.info('[BlogIndex] prefetch', { slug })
  }

  return (
    <>
      <Head>
        <title>Latimere Blog — Practical STR Growth</title>
        <meta
          name="description"
          content="Pricing moves, guest messaging scripts, turnover playbooks, and owner reporting that drives profit in the Smokies."
        />
        <link rel="canonical" href={canonicalUrl} />
        {/* Open Graph / Twitter */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Latimere Blog — Practical STR Growth" />
        <meta property="og:description" content="Practical posts to grow STR performance in the Smokies." />
        <meta property="og:image" content="/og.png" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Latimere Blog — Practical STR Growth" />
        <meta name="twitter:description" content="Practical posts to grow STR performance in the Smokies." />
        <meta name="twitter:image" content="/og.png" />
        <meta name="twitter:url" content={canonicalUrl} />
      </Head>

      {/* Shared nav (matches blog post pages) */}
      <TopNav />

      {/* HERO */}
      <section className="relative border-b border-white/10 bg-gray-950 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(0,120,120,0.35),transparent_65%)]"
        />
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Insights that turn STRs into standouts.
              </h1>
              <p className="mt-3 max-w-prose text-gray-300">
                What actually works in the Smokies: pricing moves, guest messaging scripts, turnover playbooks,
                and owner reporting that drives profit.
              </p>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/#contact"
                  className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                  onClick={() => console.info('[CTA] blog hero → Get Estimate')}
                >
                  Get your free revenue estimate
                </Link>
                <a
                  href="/#services"
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                >
                  See what’s included
                </a>
              </div>
              <p className="mt-3 text-xs text-gray-400">Serving Gatlinburg • Pigeon Forge • Sevierville</p>
            </div>

            <div className="relative h-56 overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:h-72 lg:h-[20rem]">
              <Image
                src="/images/cabin-living-01.jpg"
                alt="Latimere managed living room"
                fill
                sizes="(min-width:1024px) 48vw, 100vw"
                className="object-cover"
                priority
                onLoadingComplete={() => console.info('[BlogIndex] hero image loaded')}
                onError={(e) => console.warn('[BlogIndex] hero image failed', e)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/40 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* POSTS GRID */}
      <main className="bg-gray-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
              No blog posts yet. Add markdown files to <code className="font-mono">content/blog/</code>.
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <li
                  key={p.slug}
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.06]"
                >
                  <Link
                    href={`/blog/${p.slug}`}
                    className="block focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                    onMouseEnter={() => prefetchPost(p.slug)}
                    onFocus={() => prefetchPost(p.slug)}
                    onClick={() => console.info('[BlogIndex] open post', { slug: p.slug })}
                  >
                    <div className="relative h-44 overflow-hidden rounded-xl">
                      <Image
                        src={p.coverImage || '/images/cabin-exterior-01.jpg'}
                        alt={p.title}
                        fill
                        sizes="(min-width:1024px) 420px, (min-width:640px) 50vw, 100vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.02]"
                        onLoadingComplete={() => console.info('[BlogIndex] card image loaded', { slug: p.slug })}
                        onError={(e) => console.warn('[BlogIndex] card image failed', { slug: p.slug, error: e })}
                      />
                    </div>
                    <div className="px-1 pt-3">
                      <div className="text-[12px] text-gray-400">
                        {p.date} · {p.author || 'Latimere Team'}
                      </div>
                      <h2 className="mt-1 line-clamp-2 text-lg font-semibold text-white">{p.title}</h2>
                      {p.excerpt && <p className="mt-1 line-clamp-2 text-sm text-gray-300">{p.excerpt}</p>}
                      <span className="mt-3 inline-block text-sm font-semibold text-cyan-400">Read article →</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* SALES CTA */}
        <section className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-white lg:flex lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h3 className="text-xl font-semibold">Want these results for your cabin?</h3>
                <p className="mt-1 text-sm text-gray-300">
                  Get a free revenue estimate and a concrete 30-day plan to improve occupancy and ADR.
                </p>
              </div>
              <div className="mt-4 flex gap-3 lg:mt-0">
                <Link
                  href="/#contact"
                  className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                  onClick={() => console.info('[CTA] blog footer → Estimate')}
                >
                  Get my estimate
                </Link>
                <a
                  href="/#services"
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  onClick={() => console.info('[CTA] blog footer → Services')}
                >
                  See services
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

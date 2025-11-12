// pages/blog/[slug].tsx
import React, { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { GetStaticPaths, GetStaticProps } from 'next'

import TopNav from '../../components/TopNav'
import SiteFooter from '../../components/SiteFooter'
import { type BlogPost, getAllPosts, getPostBySlug, markdownToHtml } from '../../lib/blog'

type Props = { post: BlogPost }

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts()
  return { paths: posts.map((p) => ({ params: { slug: p.slug } })), fallback: false }
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string
  const post = getPostBySlug(slug)
  if (!post) return { notFound: true }
  const content = await markdownToHtml(post.content || '')
  return { props: { post: { ...post, content } } }
}

export default function BlogPostPage({ post }: Props) {
  const router = useRouter()
  const appUrlEnv = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const metaDescription = post.excerpt || post.title

  const [coverSrc, setCoverSrc] = useState(post.coverImage || '/images/cabin-exterior-01.jpg')
  const onCoverError = () => {
    if (coverSrc !== '/images/cabin-exterior-02.jpg') {
      console.warn('[BlogPost] cover image failed → fallback', { from: coverSrc })
      setCoverSrc('/images/cabin-exterior-02.jpg')
    }
  }

  // Canonical is SSR-safe; relative in dev
  const canonicalUrl = appUrlEnv ? `${appUrlEnv}/blog/${post.slug}` : `/blog/${post.slug}`

  // Build a share URL purely from client origin (no localhost note)
  const [clientOrigin, setClientOrigin] = useState('')
  useEffect(() => {
    if (typeof window !== 'undefined') setClientOrigin(window.location.origin)
  }, [])
  const shareUrl = useMemo(() => {
    if (clientOrigin) return `${clientOrigin}/blog/${post.slug}`
    if (appUrlEnv) return `${appUrlEnv}/blog/${post.slug}`
    return canonicalUrl
  }, [clientOrigin, appUrlEnv, post.slug, canonicalUrl])

  useEffect(() => {
    console.info('[BlogPost] mounted', { path: router.asPath, shareUrl, canonicalUrl })
  }, [router.asPath, shareUrl, canonicalUrl])

  const onArticleClickCapture = (e: React.MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest('a')
    if (!anchor) return
    const href = anchor.getAttribute('href') || ''
    const isModified =
      e.nativeEvent instanceof MouseEvent &&
      (e.nativeEvent.metaKey || e.nativeEvent.ctrlKey || e.nativeEvent.shiftKey || e.nativeEvent.button === 1)
    console.info('[BlogPost] link click', { href })
    if (isModified || anchor.target === '_blank') return
    if (href === '/estimate' || href.startsWith('/estimate?')) {
      e.preventDefault()
      router.push('/#contact')
    }
  }

  const logShare = (network: 'facebook' | 'twitter' | 'linkedin') =>
    console.info('[Share] open', { network, url: shareUrl })

  return (
    <>
      <Head>
        <title>{post.title} · Latimere Blog</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${post.title} · Latimere Blog`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={coverSrc} />
        <meta property="og:url" content={shareUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${post.title} · Latimere Blog`} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={coverSrc} />
        <meta name="twitter:url" content={shareUrl} />
      </Head>

      <TopNav />

      <article className="bg-gray-950 text-white">
        {/* Hero */}
        <div className="relative h-[42vh] min-h-[280px] w-full overflow-hidden border-b border-white/10">
          <Image
            src={coverSrc}
            alt={post.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            onLoadingComplete={() => console.info('[BlogPost] cover loaded', { src: coverSrc })}
            onError={onCoverError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-4xl px-4 pb-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{post.title}</h1>
            <p className="mt-1 text-sm text-gray-300">
              {post.date} · {post.author || 'Latimere Team'}
            </p>
          </div>
        </div>

        {/* Body + Sidebar */}
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_280px] lg:px-8">
          <div
            className="prose-latimere panel relative z-10 max-w-none"
            onClickCapture={onArticleClickCapture}
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />

          <aside className="relative z-0 lg:pt-2">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="text-base font-semibold">Get a free revenue estimate</h3>
                <p className="mt-1 text-sm text-gray-300">
                  We’ll review your listing and send a plan to lift occupancy &amp; ADR.
                </p>
                <Link
                  href="/#contact"
                  className="mt-3 inline-flex rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-cyan-400"
                  onClick={() => console.info('[CTA] blog post → Estimate', { fromSlug: post.slug })}
                >
                  Get my estimate
                </Link>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <h4 className="text-sm font-semibold">Share</h4>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-cyan-300">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank" rel="noreferrer" className="hover:underline"
                    onClick={() => logShare('facebook')}
                  >Facebook</a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                    target="_blank" rel="noreferrer" className="hover:underline"
                    onClick={() => logShare('twitter')}
                  >X / Twitter</a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank" rel="noreferrer" className="hover:underline"
                    onClick={() => logShare('linkedin')}
                  >LinkedIn</a>
                  <button
                    type="button"
                    className="text-cyan-300 hover:underline"
                    onClick={async () => {
                      try { await navigator.clipboard.writeText(shareUrl); alert('Link copied!') }
                      catch { prompt('Copy this link:', shareUrl) }
                    }}
                  >
                    Copy link
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <h4 className="text-sm font-semibold">More from Latimere</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-300">
                  <li><a className="hover:text-white" href="/#services">What’s included</a></li>
                  <li><a className="hover:text-white" href="/#operations">Owner reporting</a></li>
                  <li><a className="hover:text-white" href="/#gallery">Property gallery</a></li>
                </ul>
              </div>
            </div>
          </aside>
        </div>

        <div className="mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
          <Link href="/blog" className="text-cyan-400 hover:underline">← Back to blog</Link>
        </div>
      </article>

      <SiteFooter />
    </>
  )
}

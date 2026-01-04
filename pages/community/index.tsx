// pages/community/index.tsx
/* eslint-disable no-console */
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import { withSSRContext } from 'aws-amplify'
import { FormEvent, useState } from 'react'

// ---------------- Types ----------------

type PostType = 'QUESTION' | 'DISCUSSION'

type Post = {
  id: string
  owner: string
  type: PostType
  title: string
  slug: string
  contentMD?: string | null
  tags?: string[] | null
  score: number
  answersCount?: number | null
  createdAt?: string | null
  updatedAt?: string | null
}

type CommunityIndexProps = {
  posts: Post[]
  initialQuery: string
  initialTag: string
}

// ---------------- Inline GraphQL ----------------

const GQL_LIST_POSTS = /* GraphQL */ `
  query ListPosts($limit: Int, $nextToken: String) {
    listPosts(limit: $limit, nextToken: $nextToken) {
      items {
        id
        owner
        type
        title
        slug
        contentMD
        tags
        score
        answersCount
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`

// ---------------- Page Component ----------------

export default function CommunityIndexPage({
  posts,
  initialQuery,
  initialTag,
}: CommunityIndexProps) {
  const router = useRouter()
  const [q, setQ] = useState(initialQuery)

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(router.query as any)
    if (q.trim()) {
      params.set('q', q.trim())
    } else {
      params.delete('q')
    }
    router.push({
      pathname: '/community',
      query: Object.fromEntries(params.entries()),
    })
  }

  const hasFilter = !!initialQuery || !!initialTag

  return (
    <>
      <Head>
        <title>Latimere Community</title>
        <meta
          name="description"
          content="Questions, discussions, and answers from the Latimere community of short–term rental operators."
        />
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/community`}
        />
      </Head>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-500">
              Latimere Community
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              Questions &amp; discussions
            </h1>
            {hasFilter && (
              <p className="mt-1 text-xs text-slate-500">
                Showing results for{' '}
                {initialQuery && (
                  <span className="font-medium">
                    “{initialQuery}”
                    {initialTag && ' · '}
                  </span>
                )}
                {initialTag && (
                  <span className="font-medium">tag: #{initialTag}</span>
                )}
              </p>
            )}
          </div>

          <form
            onSubmit={handleSearch}
            className="flex w-full max-w-sm items-center gap-2"
          >
            <input
              type="search"
              placeholder="Search posts…"
              className="flex-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-cyan-500"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-full bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-cyan-400"
            >
              Search
            </button>
          </form>
        </header>

        <section className="space-y-3">
          {posts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No posts yet. Be the first to{' '}
              <Link
                href="/community/ask"
                className="font-medium text-cyan-700 underline"
              >
                ask a question
              </Link>
              .
            </div>
          )}

          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                  {post.type === 'QUESTION' ? 'Question' : 'Discussion'}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                  Score: {post.score ?? 0}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                  Answers: {post.answersCount ?? 0}
                </span>
                {post.createdAt && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <h2 className="text-lg font-semibold text-slate-900">
                <Link
                  href={`/community/post/${post.slug}`}
                  className="hover:underline"
                >
                  {post.title}
                </Link>
              </h2>

              {post.tags && post.tags.length > 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  {post.tags.map((t) => (
                    <Link
                      key={t}
                      href={{ pathname: '/community', query: { tag: t } }}
                      className="mr-2 hover:underline"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>

        <div className="mt-8 text-center">
          <Link
            href="/community/ask"
            className="inline-block rounded-2xl bg-cyan-400 px-4 py-2 text-slate-900 shadow hover:shadow-md"
            onClick={() =>
              (window as any)?.latimere?.trackCTA?.('community_index_ask')
            }
          >
            Ask a Question
          </Link>
        </div>
      </main>
    </>
  )
}

// ---------------- SSR ----------------

export const getServerSideProps: GetServerSideProps<
  CommunityIndexProps
> = async (ctx) => {
  const SSR = withSSRContext({ req: ctx.req as any })
  const logPrefix = '🌐 [CommunityIndex/SSR]'

  const q = (ctx.query.q as string | undefined)?.trim() ?? ''
  const tag = (ctx.query.tag as string | undefined)?.trim() ?? ''

  const LIMIT = 200
  const MAX_PAGES = 10

  const allPosts: Post[] = []
  let nextToken: string | null = null
  let pages = 0

  try {
    do {
      const res = (await SSR.API.graphql({
        query: GQL_LIST_POSTS,
        variables: { limit: LIMIT, nextToken },
        authMode: 'AWS_IAM',
      })) as any

      const payload = res?.data?.listPosts
      const items: Post[] = payload?.items ?? []
      allPosts.push(...items)

      nextToken = (payload?.nextToken as string | null) ?? null
      pages++

      console.log(`${logPrefix} page`, {
        page: pages,
        pageItems: items.length,
        totalSoFar: allPosts.length,
        nextToken,
      })
    } while (nextToken && pages < MAX_PAGES)
  } catch (err) {
    console.error(`${logPrefix} error listing posts`, err)
  }

  // In-memory filtering for MVP
  let filtered = allPosts

  if (tag) {
    filtered = filtered.filter((p) => p.tags?.includes(tag))
  }

  if (q) {
    const qLower = q.toLowerCase()
    filtered = filtered.filter((p) => {
      const haystack =
        `${p.title ?? ''} ${(p.contentMD ?? '').slice(0, 5000)}`.toLowerCase()
      return haystack.includes(qLower)
    })
  }

  // Sort newest first, then score
  filtered.sort((a, b) => {
    const aDate = new Date(a.createdAt || 0).getTime()
    const bDate = new Date(b.createdAt || 0).getTime()
    if (bDate !== aDate) return bDate - aDate
    return (b.score ?? 0) - (a.score ?? 0)
  })

  console.log(`${logPrefix} done`, {
    total: allPosts.length,
    filtered: filtered.length,
    q,
    tag,
  })

  return {
    props: {
      posts: filtered,
      initialQuery: q,
      initialTag: tag,
    },
  }
}

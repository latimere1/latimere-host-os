// pages/community/index.tsx
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { GetServerSideProps } from 'next'

// Client-side Amplify API (browser)
import { API } from 'aws-amplify'

// ✅ Server-side helpers for Next.js (v6 replacement for withSSRContext)
import { createServerRunner } from '@aws-amplify/adapter-nextjs'
import { generateClient as generateServerClient } from 'aws-amplify/api/server'

// Use RELATIVE paths to avoid alias issues
import PostCard from '../../components/community/PostCard'
import CTA from '../../components/community/CTA'
import * as GenQueries from '../../src/graphql/queries'

// Your Amplify config (adjust if yours lives elsewhere)
import awsExports from '../../src/aws-exports'

// Create a reusable server runner once per module
export const { runWithAmplifyServerContext } = createServerRunner({
  config: awsExports, // same config you pass to Amplify.configure on the client
})

// ---- Types matching the schema we defined ----
type PostType = 'QUESTION' | 'DISCUSSION'
type Post = {
  id: string
  owner: string
  type: PostType
  title: string
  slug: string
  contentMD: string
  tags: string[]
  score: number
  answersCount: number
  acceptedAnswerId?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

type IndexProps = {
  initialPosts: Post[]
  sort: 'new' | 'hot' | 'unanswered'
  tag?: string | null
  initialNextToken: string | null
  q?: string | null
}

// Tabs
const SORTS = [
  { key: 'new', label: 'New' },
  { key: 'hot', label: 'Hot' },
  { key: 'unanswered', label: 'Unanswered' },
] as const

// -------- Inline gql fallbacks (include nextToken) --------
const FALLBACK_LIST_POSTS = /* GraphQL */ `
  query ListPosts($limit: Int, $nextToken: String) {
    listPosts(limit: $limit, nextToken: $nextToken) {
      items {
        id owner type title slug contentMD tags score answersCount acceptedAnswerId createdAt updatedAt
      }
      nextToken
    }
  }
`

const FALLBACK_SEARCH_POSTS = /* GraphQL */ `
  query SearchPosts($filter: SearchablePostFilterInput, $limit: Int, $nextToken: String) {
    searchPosts(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id owner type title slug contentMD tags score answersCount acceptedAnswerId createdAt updatedAt
      }
      nextToken
    }
  }
`

export default function CommunityIndex({ initialPosts, sort, tag, initialNextToken, q }: IndexProps) {
  const router = useRouter()

  // State for client-side pagination ("Load more")
  const [postsState, setPosts] = useState<Post[]>(initialPosts)
  const [nextToken, setNextToken] = useState<string | null>(initialNextToken)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadErr, setLoadErr] = useState<string | null>(null)

  // Client search (local filter only; no backend change)
  const [query, setQuery] = useState(q ?? '')
  const debounced = useDebounced(query, 150)

  // Client-side logging + analytics
  useEffect(() => {
    console.log('🧱 Community index mounted', {
      sort,
      tag,
      q: query,
      count: postsState.length,
      hasNextToken: Boolean(nextToken),
      path: router.asPath,
    })
    ;(window as any)?.latimere?.trackCTA?.('community_index_impression', { sort, tag, q: query })
  }, [sort, tag, query, postsState.length, nextToken, router.asPath])

  // Keep state in sync when SSR props change
  useEffect(() => {
    setPosts(initialPosts)
    setNextToken(initialNextToken)
  }, [initialPosts, initialNextToken])

  // Derived sorted/filtered list (adds local search)
  const posts = useMemo(() => {
    let arr = [...postsState]

    const needle = debounced.trim().toLowerCase()
    if (needle) {
      arr = arr.filter((p) => {
        if (p.title?.toLowerCase().includes(needle)) return true
        if (p.contentMD?.toLowerCase().includes(needle)) return true
        if (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(needle))) return true
        return false
      })
    }

    switch (sort) {
      case 'hot':
        arr.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        break
      case 'unanswered':
        arr = arr.filter((p) => (p.answersCount ?? 0) === 0)
        arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        break
      case 'new':
      default:
        arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    }
    return arr
  }, [postsState, sort, debounced])

  // Persist q in URL without refetching SSR
  useEffect(() => {
    const url = new URL(window.location.href)
    if (query) url.searchParams.set('q', query)
    else url.searchParams.delete('q')
    window.history.replaceState({}, '', url.toString())
  }, [query])

  const active = (k: string) =>
    `px-3 py-1 rounded-2xl transition ${
      sort === k ? 'bg-cyan-400 text-slate-900 shadow' : 'bg-white/80 text-slate-600 hover:bg-white'
    }`

  function setSort(next: 'new' | 'hot' | 'unanswered') {
    const qsp = new URLSearchParams(router.query as Record<string, string>)
    qsp.set('sort', next)
    qsp.delete('nextToken') // reset pagination on sort change
    router.replace({ pathname: router.pathname, query: qsp.toString() }, undefined, { shallow: false })
  }

  // -------- Load more (client-side) --------
  async function loadMore() {
    if (!nextToken) return
    setLoadingMore(true)
    setLoadErr(null)

    const LIMIT = 40
    const isTagFiltered = !!tag

    try {
      const queryDoc =
        (isTagFiltered ? (GenQueries as any).searchPosts : (GenQueries as any).listPosts) ||
        (isTagFiltered ? FALLBACK_SEARCH_POSTS : FALLBACK_LIST_POSTS)

      const variables: any = isTagFiltered
        ? { filter: { tags: { contains: tag } }, limit: LIMIT, nextToken }
        : { limit: LIMIT, nextToken }

      console.log('📥 Load more (client)', { isTagFiltered, variables })

      // Try IAM first, then USER_POOLS
      let data: any
      try {
        const res = (await API.graphql({
          query: queryDoc,
          variables,
          authMode: 'AWS_IAM',
        })) as any
        data = res.data
      } catch (iamErr) {
        console.warn('ℹ️ Client loadMore IAM failed; retrying USER_POOLS…', iamErr)
        const res2 = (await API.graphql({
          query: queryDoc,
          variables,
          authMode: 'AMAZON_COGNITO_USER_POOLS',
        })) as any
        data = res2.data
      }

      const result = isTagFiltered ? data?.searchPosts : data?.listPosts
      const items: Post[] = result?.items ?? []
      const nt: string | null = result?.nextToken ?? null

      console.log('✅ Load more success', { received: items.length, nextToken: Boolean(nt) })

      setPosts((prev) => [...prev, ...items])
      setNextToken(nt)
    } catch (err: any) {
      console.error('❌ Load more failed', err)
      setLoadErr(err?.message || 'Failed to load more posts.')
    } finally {
      setLoadingMore(false)
    }
  }

  const sentinelRef = useAutoLoadMore(loadMore, Boolean(nextToken), loadingMore)

  return (
    <>
      <Head>
        <title>Latimere Community — STR Q&A & Discussions</title>
        <meta
          name="description"
          content="Ask and answer short-term rental questions: pricing, cleanings, tech, guest messaging and more. Join the Latimere community."
        />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/community`} />
      </Head>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-semibold">Latimere Community</h1>
          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center">
            <SearchBox value={query} onChange={setQuery} />
            <Link
              href="/community/ask"
              className="rounded-2xl shadow px-4 py-2 bg-cyan-400 text-slate-900 hover:shadow-md text-center"
              onClick={() => (window as any)?.latimere?.trackCTA?.('ask_question')}
            >
              Ask a Question
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
            {SORTS.map((s) => (
              <button key={s.key} className={active(s.key)} onClick={() => setSort(s.key as any)}>
                {s.label}
              </button>
            ))}
          </div>
          {tag ? (
            <div className="text-sm text-slate-600">
              Tag filter:
              <span className="ml-2 rounded-full bg-slate-2 00 px-2 py-0.5">#{tag}</span>
              <button
                className="ml-3 text-slate-500 underline"
                onClick={() => {
                  const qsp = new URLSearchParams(router.query as Record<string, string>)
                  qsp.delete('tag')
                  qsp.delete('nextToken')
                  router.replace({ pathname: router.pathname, query: qsp.toString() }, undefined, { shallow: false })
                }}
              >
                clear
              </button>
            </div>
          ) : null}
        </div>

        <ul className="mt-6 space-y-4">
          {posts.map((p) => (
            <li key={p.id}>
              <PostCard
                id={p.id}
                type={p.type}
                title={p.title}
                slug={p.slug}
                tags={p.tags}
                score={p.score}
                answersCount={p.answersCount}
                acceptedAnswerId={p.acceptedAnswerId}
                createdAt={p.createdAt}
              />
            </li>
          ))}

          {posts.length === 0 && (
            <li className="rounded-2xl border border-dashed p-8 text-center text-slate-600">
              {debounced ? (
                <>
                  No matches for “<span className="font-semibold">{debounced}</span>”.
                  <button
                    className="ml-2 text-cyan-700 underline"
                    onClick={() => setQuery('')}
                    title="Clear search"
                  >
                    clear search
                  </button>
                </>
              ) : (
                <>
                  No posts yet{tag ? ` for #${tag}` : ''}. Be the first to{' '}
                  <Link href="/community/ask" className="text-cyan-700 underline">
                    ask a question
                  </Link>
                  .
                </>
              )}
            </li>
          )}
        </ul>

        {/* Load more */}
        <div className="mt-6 flex items-center gap-3">
          {nextToken ? (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className={`rounded-2xl px-4 py-2 text-slate-900 shadow ${
                loadingMore ? 'bg-slate-300 cursor-not-allowed' : 'bg-cyan-400 hover:shadow-md'
              }`}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          ) : (
            <span className="text-sm text-slate-500">No more posts.</span>
          )}
          {loadErr && <span className="text-sm text-red-600">{loadErr}</span>}
        </div>

        <div ref={sentinelRef} aria-hidden className="h-1 w-full" />

        <div className="mt-10">
          <CTA
            title="Need a pro co-host?"
            body="We manage STRs in Sevierville, Pigeon Forge, and Gatlinburg."
            buttonLabel="Book a consult"
            href="/hosting#consult"
            utm={{ utm_source: 'community', utm_medium: 'sidebar', utm_campaign: 'consult' }}
            eventLabel="community_sidebar_consult"
            variant="accent"
          />
        </div>
      </div>
    </>
  )
}

/** ---------------------- helpers & hooks ---------------------- */

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [v, setV] = useState(value)
  useEffect(() => setV(value), [value])

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setV(next)
    onChange(next)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔎 search change', { q: next })
    }
  }

  return (
    <div className="relative">
      <input
        type="search"
        value={v}
        onChange={onInput}
        placeholder="Search titles, tags, and content"
        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 sm:min-w-[280px]"
        aria-label="Search community posts"
      />
      {v && (
        <button
          type="button"
          onClick={() => onChange('')}
          title="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-300"
        >
          clear
        </button>
      )}
    </div>
  )
}

function useDebounced(value: string, delay = 150) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

function useAutoLoadMore(loadMore: () => void, canLoad: boolean, isLoading: boolean) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!canLoad) return
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && canLoad && !isLoading) {
            console.log('👀 sentinel visible → auto load more')
            loadMore()
          }
        })
      },
      { rootMargin: '1200px 0px 0px 0px', threshold: 0 }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [loadMore, canLoad, isLoading])

  return ref
}

/**
 * Server-side data (Amplify v6 + Next adapter)
 * Replaces v5 withSSRContext. Uses server GraphQL client with per-request context.
 */
export const getServerSideProps: GetServerSideProps<IndexProps> = async (ctx) => {
  const sort = ((ctx.query.sort as string)?.toLowerCase() as IndexProps['sort']) || 'new'
  const tag = (ctx.query.tag as string) || null
  const q = (ctx.query.q as string) || null
  const LIMIT = 40

  let initialPosts: Post[] = []
  let initialNextToken: string | null = null

  // Helper performing one pass with a specific authMode
  const runOnce = async (authMode: 'AWS_IAM' | 'AMAZON_COGNITO_USER_POOLS') =>
    runWithAmplifyServerContext({
      nextServerContext: { req: ctx.req, res: ctx.res },
      operation: async (contextSpec) => {
        const usingSearch = !!tag
        const query =
          (usingSearch ? (GenQueries as any).searchPosts : (GenQueries as any).listPosts) ||
          (usingSearch ? FALLBACK_SEARCH_POSTS : FALLBACK_LIST_POSTS)

        const variables: any = usingSearch
          ? { filter: { tags: { contains: tag } }, limit: LIMIT, nextToken: null }
          : { limit: LIMIT, nextToken: null }

        // Create a server-side GraphQL client and execute with the request context
        const client = generateServerClient({ authMode })
        console.log(usingSearch ? '🔎 SSR searchPosts' : '📚 SSR listPosts', {
          using: query === (usingSearch ? FALLBACK_SEARCH_POSTS : FALLBACK_LIST_POSTS) ? 'inline' : 'codegen',
          authMode,
          variables,
        })

        const { data } = await client.graphql({ query, variables }, contextSpec)
        const result = usingSearch ? (data as any)?.searchPosts : (data as any)?.listPosts
        return {
          items: (result?.items ?? []) as Post[],
          token: (result?.nextToken ?? null) as string | null,
        }
      },
    })

  try {
    // Try IAM first (public reads), then fall back to User Pools if needed
    const r1 = await runOnce('AWS_IAM')
    initialPosts = r1.items
    initialNextToken = r1.token

    if (!initialPosts.length) {
      console.warn('ℹ️ IAM SSR read returned 0 items; retrying with USER_POOLS…')
      const r2 = await runOnce('AMAZON_COGNITO_USER_POOLS')
      initialPosts = r2.items
      initialNextToken = r2.token
    }
  } catch (err) {
    console.error('⚠️ SSR API (IAM) failed, retrying USER_POOLS…', err)
    try {
      const r2 = await runOnce('AMAZON_COGNITO_USER_POOLS')
      initialPosts = r2.items
      initialNextToken = r2.token
    } catch (err2) {
      console.error('❌ SSR API (USER_POOLS) also failed. Rendering empty list.', err2)
      initialPosts = []
      initialNextToken = null
    }
  }

  // Light server-side sorting (client repeats to be safe)
  if (sort === 'hot') {
    initialPosts.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  } else if (sort === 'new') {
    initialPosts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
  } else if (sort === 'unanswered') {
    initialPosts = initialPosts.filter((p) => (p.answersCount ?? 0) === 0)
  }

  console.log('✅ SSR community index done', {
    sort,
    tag,
    q,
    returned: initialPosts.length,
    hasNextToken: Boolean(initialNextToken),
  })

  return {
    props: {
      initialPosts,
      sort,
      tag,
      initialNextToken,
      q,
    },
  }
}

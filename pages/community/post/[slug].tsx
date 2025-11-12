// pages/community/post/[slug].tsx
import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { withSSRContext, API, Auth } from 'aws-amplify'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'

import CTA from '../../components/community/CTA'
import MarkdownEditor from '../../components/community/MarkdownEditor'

// Optional codegen imports; inline fallbacks are provided
import * as GenQueries from '@/graphql/queries'
import * as GenMutations from '@/graphql/mutations'

// Client-only to avoid SSR hiccups
const VoteWidget = dynamic(() => import('../../components/community/VoteWidget'), { ssr: false })

// -------- Inline GraphQL fallbacks (safe if codegen not available) --------
const FALLBACK_POST_BY_SLUG = /* GraphQL */ `
  query PostBySlug($slug: String!, $limit: Int) {
    postBySlug(slug: $slug, limit: $limit) {
      items {
        id owner type title slug contentMD tags score answersCount acceptedAnswerId createdAt updatedAt
      }
      nextToken
    }
  }
`

const FALLBACK_LIST_ANSWERS = /* GraphQL */ `
  query ListAnswers($filter: ModelAnswerFilterInput, $limit: Int) {
    listAnswers(filter: $filter, limit: $limit) {
      items {
        id owner postId contentMD score isAccepted createdAt updatedAt
      }
    }
  }
`

const FALLBACK_CREATE_ANSWER = /* GraphQL */ `
  mutation CreateAnswer($input: CreateAnswerInput!) {
    createAnswer(input: $input) {
      id owner postId contentMD score isAccepted createdAt
    }
  }
`

// -------- Types --------
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

type Answer = {
  id: string
  owner: string
  postId: string
  contentMD: string
  score: number
  isAccepted: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

type PageProps = {
  post: Post
  answers: Answer[]
}

const MAX_ANSWER = 5000

export default function PostPage({ post, answers }: PageProps) {
  const router = useRouter()
  const [contentMD, setContent] = useState('')
  const [isSubmitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isAuthed, setAuthed] = useState<boolean | null>(null)

  // Per-post draft key
  const DRAFT_KEY = useMemo(() => `latimere.community.answerDraft.${post.id}`, [post.id])

  // Mount + restore draft + telemetry + auth snapshot
  useEffect(() => {
    console.log('🧾 Post page mounted', { slug: post.slug, answers: answers.length, path: router.asPath })
    ;(window as any)?.latimere?.trackCTA?.('open_post', { slug: post.slug })

    // restore draft
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const d = JSON.parse(raw)
        if (typeof d?.contentMD === 'string') {
          setContent(d.contentMD)
          console.log('📝 Restored answer draft from localStorage')
        }
      }
    } catch (e) {
      console.warn('⚠️ Failed to parse saved answer draft', e)
    }

    // snapshot auth state (non-blocking)
    Auth.currentAuthenticatedUser()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false))
  }, [post.slug, answers.length, router.asPath, DRAFT_KEY])

  // Save draft as the user types
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ contentMD }))
    } catch (e) {
      console.warn('⚠️ Failed to save answer draft', e)
    }
  }, [contentMD, DRAFT_KEY])

  // JSON-LD for SEO (QAPage for questions; DiscussionForumPosting for discussions)
  const jsonLd = useMemo(() => {
    if (post.type === 'QUESTION') {
      const accepted = answers.find((a) => a.isAccepted)
      const mainEntity = {
        '@type': 'Question',
        name: post.title,
        text: post.contentMD?.slice(0, 5000),
        answerCount: answers.length,
        dateCreated: post.createdAt || undefined,
        acceptedAnswer: accepted
          ? {
              '@type': 'Answer',
              text: accepted.contentMD?.slice(0, 5000),
              dateCreated: accepted.createdAt || undefined,
              upvoteCount: accepted.score ?? 0,
            }
          : undefined,
        suggestedAnswer: answers
          .filter((a) => !a.isAccepted)
          .slice(0, 5)
          .map((a) => ({
            '@type': 'Answer',
            text: a.contentMD?.slice(0, 5000),
            dateCreated: a.createdAt || undefined,
            upvoteCount: a.score ?? 0,
          })),
      }
      return { '@context': 'https://schema.org', '@type': 'QAPage', mainEntity }
    }
    // Discussion
    return {
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      headline: post.title,
      dateCreated: post.createdAt || undefined,
      articleBody: post.contentMD?.slice(0, 5000),
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: { '@type': 'LikeAction' },
        userInteractionCount: post.score ?? 0,
      },
    }
  }, [post, answers])

  async function submitAnswer(e: React.FormEvent) {
    e.preventDefault()

    if (!contentMD.trim()) {
      setErrorMsg('Answer cannot be empty.')
      return
    }
    if (contentMD.length > MAX_ANSWER) {
      setErrorMsg(`Answer exceeds ${MAX_ANSWER} characters.`)
      return
    }

    setSubmitting(true)
    setErrorMsg(null)
    setHint(null)
    console.time?.('⏱ createAnswer')

    try {
      const user = await Auth.currentAuthenticatedUser()
      const input = {
        owner: user?.attributes?.sub,
        postId: post.id,
        contentMD,
        score: 0,
        isAccepted: false,
      }

      console.log('✍️ Creating answer', { postId: post.id, contentLen: contentMD.length })

      const mutation = (GenMutations as any).createAnswer || FALLBACK_CREATE_ANSWER

      await API.graphql({
        query: mutation,
        variables: { input },
        authMode: 'AMAZON_COGNITO_USER_POOLS',
      })

      ;(window as any)?.latimere?.trackCommunity?.('answer_submitted', { slug: post.slug })

      console.log('✅ Answer created — reloading to fetch latest answers')
      setContent('')
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {}
      router.replace(router.asPath)
    } catch (err: any) {
      console.error('❌ Failed to create answer', err)
      setErrorMsg(err?.message || 'Something went wrong posting your answer.')
      setHint('Verify you are signed in and that AppSync allows USER_POOLS for createAnswer.')
    } finally {
      console.timeEnd?.('⏱ createAnswer')
      setSubmitting(false)
    }
  }

  // Keyboard shortcut: Cmd/Ctrl+Enter to submit
  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isSubmitting) {
      console.log('⌨️ Submit shortcut used (Cmd/Ctrl+Enter)')
      ;(e.target as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      console.log('🔗 Post link copied to clipboard')
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      console.warn('⚠️ Failed to copy link', e)
    }
  }

  return (
    <>
      <Head>
        <title>{post.title} · Latimere Community</title>
        <meta name="description" content={`Read and discuss: ${post.title} — Latimere Community`} />
        {/* SEO JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <div className="mx-auto max-w-5xl px-4 py-8 grid grid-cols-12 gap-6">
        <article className="col-span-12 lg:col-span-9">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-2 py-0.5">
              {post.type === 'QUESTION' ? 'Question' : 'Discussion'}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5">Score: {post.score ?? 0}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5">Answers: {post.answersCount ?? 0}</span>
            {post.createdAt && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                {new Date(post.createdAt).toLocaleString()}
              </span>
            )}

            {/* Post voting (client-only) */}
            <span className="ml-auto">
              <VoteWidget
                kind="post"
                id={post.id}
                initialScore={post.score ?? 0}
                onChange={(s, v) => console.log('🗳 post vote change', { id: post.id, score: s, myVote: v })}
              />
            </span>

            <button
              onClick={copyLink}
              className="text-xs rounded-full border border-slate-300 px-2 py-0.5 hover:bg-slate-50"
              title="Copy link"
            >
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>

          <h1 className="text-3xl font-semibold">{post.title}</h1>

          <div className="mt-3 text-sm text-slate-600">
            {post.tags?.map((t) => (
              <Link key={t} href={{ pathname: '/community', query: { tag: t } }} className="mr-2 hover:underline">
                #{t}
              </Link>
            ))}
          </div>

          <section className="prose max-w-none mt-6">
            <ReactMarkdown>{post.contentMD}</ReactMarkdown>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-3">Answers ({answers.length})</h2>

            <ul className="space-y-4">
              {answers.map((a) => (
                <li id={`answer-${a.id}`} key={a.id} className="rounded-2xl shadow p-4 bg-white text-slate-900">
                  <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{a.isAccepted ? '✅ Accepted' : '—'}</span>
                    <span>Score: {a.score ?? 0}</span>
                    <span>{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</span>

                    <span className="ml-auto">
                      <VoteWidget
                        kind="answer"
                        id={a.id}
                        initialScore={a.score ?? 0}
                        onChange={(s, v) => console.log('🗳 answer vote change', { id: a.id, score: s, myVote: v })}
                      />
                    </span>
                  </div>
                  <div className="prose max-w-none">
                    <ReactMarkdown>{a.contentMD}</ReactMarkdown>
                  </div>
                </li>
              ))}

              {answers.length === 0 && (
                <li className="rounded-2xl border border-dashed p-8 text-center text-slate-600">
                  No answers yet. Be the first to help!
                </li>
              )}
            </ul>

            {/* Answer editor */}
            <form onSubmit={submitAnswer} onKeyDown={onKeyDown} className="mt-8">
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Answer (Markdown supported)</label>

              {isAuthed === false && (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  You&apos;re not signed in. You can type your answer, but you&apos;ll be prompted to sign in when posting.
                </div>
              )}

              <MarkdownEditor
                value={contentMD}
                onChange={(v) => setContent(v.slice(0, MAX_ANSWER))}
                placeholder="Share your solution, examples, links, or code…"
                minRows={8}
                maxRows={24}
                label="" // label already above
              />

              <div className="mt-1 text-xs text-slate-500">{MAX_ANSWER - contentMD.length} characters left</div>

              {errorMsg && (
                <div className="mt-3 rounded-xl bg-red-100 border border-red-300 text-red-700 p-3 text-sm">
                  {errorMsg}
                </div>
              )}
              {hint && (
                <div className="mt-3 rounded-xl bg-yellow-50 border border-yellow-300 text-yellow-800 p-3 text-xs">
                  {hint}
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`rounded-2xl shadow px-4 py-2 text-slate-900 transition ${
                    isSubmitting ? 'bg-slate-300 cursor-not-allowed' : 'bg-cyan-400 hover:shadow-md'
                  }`}
                >
                  {isSubmitting ? 'Posting…' : 'Post Answer'}
                </button>
              </div>
            </form>
          </section>
        </article>

        <aside className="col-span-12 lg:col-span-3">
          <CTA
            title="Need a pro co-host?"
            body="We manage STRs in Sevierville, Pigeon Forge, and Gatlinburg."
            buttonLabel="Book a consult"
            href="/hosting#consult"
            utm={{ utm_source: 'community', utm_medium: 'sidebar', utm_campaign: 'consult' }}
            eventLabel="community_sidebar_consult"
            variant="accent"
          />
        </aside>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const SSR = withSSRContext({ req: ctx.req as any })
  const slug = ctx.params?.slug as string

  if (!slug) {
    console.error('❌ Missing slug param')
    return { notFound: true }
  }

  const LIMIT = 100
  let post: Post | null = null
  let answers: Answer[] = []

  // Helper to execute a query with a given auth mode
  const exec = async (authMode: 'AWS_IAM' | 'AMAZON_COGNITO_USER_POOLS') => {
    console.log('🔎 SSR postBySlug', { slug, authMode })
    const postQuery = (GenQueries as any).postBySlug || FALLBACK_POST_BY_SLUG
    const res1 = (await SSR.API.graphql({
      query: postQuery,
      variables: { slug, limit: 1 },
      authMode,
    })) as any

    const found = res1?.data?.postBySlug?.items?.[0]
    if (!found) return { post: null, answers: [] }

    console.log('📄 Found post', { id: found.id, title: found.title, hasAccepted: !!found.acceptedAnswerId })

    const listAnswersQuery = (GenQueries as any).listAnswers || FALLBACK_LIST_ANSWERS
    const res2 = (await SSR.API.graphql({
      query: listAnswersQuery,
      variables: { filter: { postId: { eq: found.id } }, limit: LIMIT },
      authMode,
    })) as any

    const items = res2?.data?.listAnswers?.items ?? []
    // Prefer accepted answer first, then newest
    items.sort((a: Answer, b: Answer) => {
      if (a.isAccepted && !b.isAccepted) return -1
      if (!a.isAccepted && b.isAccepted) return 1
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })

    return { post: found as Post, answers: items as Answer[] }
  }

  try {
    // Try IAM first (matches schema read patterns), then fallback to user pools
    const r1 = await exec('AWS_IAM')
    if (r1.post) {
      post = r1.post
      answers = r1.answers
    } else {
      console.warn('ℹ️ IAM read returned no post; retrying with USER_POOLS…')
      const r2 = await exec('AMAZON_COGNITO_USER_POOLS')
      post = r2.post
      answers = r2.answers
    }
  } catch (err) {
    console.error('⚠️ SSR fetch failed (IAM). Retrying USER_POOLS…', err)
    try {
      const r2 = await exec('AMAZON_COGNITO_USER_POOLS')
      post = r2.post
      answers = r2.answers
    } catch (err2) {
      console.error('❌ SSR fetch failed (USER_POOLS). Giving up.', err2)
      post = null
      answers = []
    }
  }

  if (!post) {
    console.error('❌ Post not found for slug', slug)
    return { notFound: true }
  }

  console.log('✅ SSR post page done', {
    slug,
    answers: answers.length,
    acceptedAnswerId: post.acceptedAnswerId || null,
  })

  return { props: { post, answers } }
}

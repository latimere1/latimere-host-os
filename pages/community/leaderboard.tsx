// pages/community/leaderboard.tsx
import Head from 'next/head'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import { withSSRContext } from 'aws-amplify'

// Optional codegen (safe if not present); fallbacks below
import * as GenQueries from '@/graphql/queries'

/** ---------------- Types ---------------- */
type PostType = 'QUESTION' | 'DISCUSSION'

type Post = {
  id: string
  owner: string
  type: PostType
  title: string
  slug: string
  score: number
  createdAt?: string | null
}

type Answer = {
  id: string
  owner: string
  postId: string
  score: number
  isAccepted: boolean
  createdAt?: string | null
}

type UserProfile = {
  id: string
  owner: string
  username: string
}

type Row = {
  owner: string
  display: string
  posts: number
  answers: number
  accepted: number
  postScore: number
  answerScore: number
  totalScore: number
}

type Props = {
  rows: Row[]
  generatedAt: string
}

/** --------------- Fallback GQL --------------- */
const FALLBACK_LIST_POSTS = /* GraphQL */ `
  query ListPosts($limit: Int, $nextToken: String) {
    listPosts(limit: $limit, nextToken: $nextToken) {
      items { id owner type title slug score createdAt }
      nextToken
    }
  }
`
const FALLBACK_LIST_ANSWERS = /* GraphQL */ `
  query ListAnswers($limit: Int, $nextToken: String) {
    listAnswers(limit: $limit, nextToken: $nextToken) {
      items { id owner postId score isAccepted createdAt }
      nextToken
    }
  }
`
const FALLBACK_LIST_USERPROFILES = /* GraphQL */ `
  query ListUserProfiles($limit: Int, $nextToken: String) {
    listUserProfiles(limit: $limit, nextToken: $nextToken) {
      items { id owner username }
      nextToken
    }
  }
`

/** --------------- Page --------------- */
export default function LeaderboardPage({ rows, generatedAt }: Props) {
  return (
    <>
      <Head>
        <title>Leaderboard · Latimere Community</title>
        <meta
          name="description"
          content="Top contributors across the Latimere Community: questions asked, answers given, accepted answers, and total score."
        />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/community/leaderboard`} />
      </Head>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Community Leaderboard</h1>
          <Link
            href="/community"
            className="rounded-2xl shadow px-4 py-2 bg-cyan-400 text-slate-900 hover:shadow-md"
          >
            ← Back to Community
          </Link>
        </div>

        <p className="mt-3 text-sm text-slate-600">
          Rankings are based on total score from posts and answers, with accepted answers as a tiebreaker. Generated:{' '}
          <span className="font-medium">{new Date(generatedAt).toLocaleString()}</span>
        </p>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow">
          <table className="min-w-full text-left text-sm text-slate-800">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Contributor</th>
                <th className="px-4 py-3">Posts</th>
                <th className="px-4 py-3">Answers</th>
                <th className="px-4 py-3">Accepted</th>
                <th className="px-4 py-3">Post Score</th>
                <th className="px-4 py-3">Answer Score</th>
                <th className="px-4 py-3">Total Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.owner} className="border-t">
                  <td className="px-4 py-3 font-semibold">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="font-medium">{r.display}</span>
                      <span className="text-xs text-slate-500">({r.owner.slice(0, 6)}…)</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.posts}</td>
                  <td className="px-4 py-3">{r.answers}</td>
                  <td className="px-4 py-3">{r.accepted}</td>
                  <td className="px-4 py-3">{r.postScore}</td>
                  <td className="px-4 py-3">{r.answerScore}</td>
                  <td className="px-4 py-3 font-semibold">{r.totalScore}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    No contributors yet. Be the first to{' '}
                    <Link href="/community/ask" className="text-cyan-700 underline">
                      ask a question
                    </Link>{' '}
                    or post an answer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/community/ask"
            className="inline-block rounded-2xl bg-cyan-400 px-4 py-2 text-slate-900 shadow hover:shadow-md"
            onClick={() => (window as any)?.latimere?.trackCTA?.('leaderboard_cta')}
          >
            Ask a Question
          </Link>
        </div>
      </div>
    </>
  )
}

/** --------------- SSR --------------- */
export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const SSR = withSSRContext({ req: ctx.req as any })

  const LIMIT = 200 // per page
  const MAX_PAGES = 10 // hard cap to avoid runaway scans
  const logPrefix = '🏆 Leaderboard SSR'

  type ListRes<T> = { items: T[]; nextToken?: string | null }

  async function pageThrough<T>(
    queryDoc: any,
    variablesBase: Record<string, any>,
    authMode: 'AWS_IAM' | 'AMAZON_COGNITO_USER_POOLS'
  ): Promise<ListRes<T>> {
    const items: T[] = []
    let nextToken: string | null = null
    let pages = 0
    do {
      const variables = { ...variablesBase, nextToken }
      const { data } = (await SSR.API.graphql({
        query: queryDoc,
        variables,
        authMode,
      })) as any
      const rootKey = Object.keys(data).find((k) => k.startsWith('list')) as keyof typeof data
      const payload = data[rootKey] as { items: T[]; nextToken?: string | null }
      items.push(...(payload?.items ?? []))
      nextToken = (payload?.nextToken as string | null) ?? null
      pages++
    } while (nextToken && pages < MAX_PAGES)
    return { items, nextToken }
  }

  async function safeFetchAll<T>(queryName: 'posts' | 'answers' | 'profiles'): Promise<T[]> {
    const isPosts = queryName === 'posts'
    const isAnswers = queryName === 'answers'
    const isProfiles = queryName === 'profiles'

    const codegen =
      (isPosts && (GenQueries as any).listPosts) ||
      (isAnswers && (GenQueries as any).listAnswers) ||
      (isProfiles && (GenQueries as any).listUserProfiles)

    const fallback =
      (isPosts && FALLBACK_LIST_POSTS) ||
      (isAnswers && FALLBACK_LIST_ANSWERS) ||
      (isProfiles && FALLBACK_LIST_USERPROFILES)

    const queryDoc = codegen || fallback

    try {
      console.log(`${logPrefix} → IAM fetch (${queryName})`)
      const res = await pageThrough<T>(queryDoc, { limit: LIMIT, nextToken: null }, 'AWS_IAM')
      console.log(`${logPrefix} ✅ IAM ${queryName}`, { items: res.items.length })
      return res.items
    } catch (e) {
      console.warn(`${logPrefix} ⚠️ IAM failed for ${queryName}; trying USER_POOLS`, e)
      try {
        const res = await pageThrough<T>(queryDoc, { limit: LIMIT, nextToken: null }, 'AMAZON_COGNITO_USER_POOLS')
        console.log(`${logPrefix} ✅ USER_POOLS ${queryName}`, { items: res.items.length })
        return res.items
      } catch (e2) {
        console.error(`${logPrefix} ❌ USER_POOLS also failed for ${queryName}`, e2)
        return []
      }
    }
  }

  // Pull data
  const [posts, answers, profiles] = await Promise.all([
    safeFetchAll<Post>('posts'),
    safeFetchAll<Answer>('answers'),
    safeFetchAll<UserProfile>('profiles'),
  ])

  // Aggregate
  const byOwner = new Map<string, Row>()
  function rowFor(owner: string): Row {
    let r = byOwner.get(owner)
    if (!r) {
      const prof = profiles.find((p) => p.owner === owner)
      const display = prof?.username || `user_${owner.slice(0, 6)}`
      r = {
        owner,
        display,
        posts: 0,
        answers: 0,
        accepted: 0,
        postScore: 0,
        answerScore: 0,
        totalScore: 0,
      }
      byOwner.set(owner, r)
    }
    return r
  }

  for (const p of posts) {
    const r = rowFor(p.owner)
    r.posts += 1
    r.postScore += p.score ?? 0
  }
  for (const a of answers) {
    const r = rowFor(a.owner)
    r.answers += 1
    r.answerScore += a.score ?? 0
    if (a.isAccepted) r.accepted += 1
  }
  for (const r of byOwner.values()) {
    r.totalScore = (r.postScore ?? 0) + (r.answerScore ?? 0)
  }

  // Sort: totalScore desc, then accepted desc, then total contributions desc
  const rows = Array.from(byOwner.values()).sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
    if (b.accepted !== a.accepted) return b.accepted - a.accepted
    const aContrib = a.posts + a.answers
    const bContrib = b.posts + b.answers
    return bContrib - aContrib
  })

  console.log(`${logPrefix} done`, {
    posts: posts.length,
    answers: answers.length,
    profiles: profiles.length,
    rows: rows.length,
  })

  return {
    props: {
      rows,
      generatedAt: new Date().toISOString(),
    },
  }
}

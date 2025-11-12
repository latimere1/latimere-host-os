// pages/community/ask.tsx
import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getCurrentUser } from 'aws-amplify/auth'
import { generateClient } from 'aws-amplify/api'
import slugify from 'slugify'

// ───────────────────── GraphQL client (respects env override) ─────────────────────
const FORCED_API_NAME = process.env.NEXT_PUBLIC_COMMUNITY_API_NAME
let _client: ReturnType<typeof generateClient> | null = null
function getCommunityClient() {
  if (_client) return _client
  _client = FORCED_API_NAME ? generateClient({ apiName: FORCED_API_NAME }) : generateClient()
  console.log('🔌 Using GraphQL API:', FORCED_API_NAME || '(Amplify default)')
  return _client
}

// Lazy editor
const MarkdownEditor = dynamic(
  () => import('../../components/community/MarkdownEditor'),
  { ssr: false, loading: () => <p className="text-slate-500">Loading editor…</p> }
)
import CTA from '../../components/community/CTA'

// If you have *community* codegen, import it and set CUSTOM_OPS below.
// import * as GenMutations from '../../src/community-graphql/mutations'
// import * as GenQueries from '../../src/community-graphql/queries'
const GenMutations: Record<string, any> = {}
const GenQueries: Record<string, any> = {}

type PostType = 'QUESTION' | 'DISCUSSION'
type Draft = { title: string; contentMD: string; tags: string; type: PostType }

const DRAFT_KEY = 'latimere.community.askDraft'
const MAX_TITLE = 140
const MAX_BODY = 5000
const MAX_TAGS = 6

const SUGGESTED_TAGS = [
  'pricing',
  'cleaning',
  'automation',
  'guest-experience',
  'marketing',
  'cohosting',
  'pigeon-forge',
  'gatlinburg',
  'sevierville',
]

// ───────────── Wiring options (use any ONE path) ─────────────
const CUSTOM_OPS = {
  // If you have community codegen: put the exact key here (e.g. 'createCommunityPost')
  createMutationKey: '',
  // Optionally help slug lookup:
  bySlugQueryKey: '',    // e.g. 'communityPostBySlug'
  listPostsQueryKey: '', // e.g. 'listCommunityPosts'
}

// Raw mutation (paste if you don’t have codegen yet)
const RAW_CREATE_MUTATION = '' /* GraphQL
mutation CreateCommunityPost($input: CreateCommunityPostInput!) {
  createCommunityPost(input: $input) { id slug title createdAt }
}
*/

// common output selection
const MUTATION_SELECTION = `{ id slug title createdAt }`

// If your schema uses different content field names, we’ll auto-try all of these:
const CONTENT_FIELD_CANDIDATES = ['contentMD', 'body', 'content', 'markdown']

// If you haven’t wired anything yet, we’ll auto-try these create mutations:
const MUTATION_NAME_CANDIDATES = [
  { name: 'createCommunityPost', input: 'CreateCommunityPostInput' },
  { name: 'createPost',          input: 'CreatePostInput' },
  { name: 'createForumPost',     input: 'CreateForumPostInput' },
  { name: 'createQuestion',      input: 'CreateQuestionInput' },
]

// ───────── Build input with a chosen content field key ─────────
function buildInput(base: Record<string, any>, contentFieldKey: string) {
  const input: Record<string, any> = {
    owner: base.owner,
    type: base.type,
    title: base.title,
    tags: base.tags,
    score: base.score,
    answersCount: base.answersCount,
    slug: base.slug,
  }
  input[contentFieldKey] = base.contentMD
  return input
}

// ───────── Pick mutation from codegen / raw / auto-try ─────────
function pickCreateMutation():
  | { mode: 'raw' | 'codegen' | 'auto'; gql: string; contentFieldKey: string; nameHint?: string }
  | null
{
  // Raw provided by you
  if (RAW_CREATE_MUTATION && RAW_CREATE_MUTATION.trim()) {
    console.log('🧭 Using RAW_CREATE_MUTATION')
    // Try to infer the content key; fall back to contentMD
    const contentKey = CONTENT_FIELD_CANDIDATES.find(k => RAW_CREATE_MUTATION.includes(k)) || 'contentMD'
    return { mode: 'raw', gql: RAW_CREATE_MUTATION, contentFieldKey: contentKey }
  }

  // Codegen provided key
  if (CUSTOM_OPS.createMutationKey) {
    const op = (GenMutations as any)[CUSTOM_OPS.createMutationKey]
    if (op) {
      console.log('🧭 Using codegen mutation:', CUSTOM_OPS.createMutationKey)
      // Assume contentMD; you can change below if needed
      return { mode: 'codegen', gql: op, contentFieldKey: 'contentMD', nameHint: CUSTOM_OPS.createMutationKey }
    }
    console.warn('⚠️ createMutationKey not found in codegen:', CUSTOM_OPS.createMutationKey, Object.keys(GenMutations))
  }

  // Auto-try common community names as raw strings
  // We’ll try each mutation name with each likely content field until one succeeds.
  for (const { name, input } of MUTATION_NAME_CANDIDATES) {
    for (const contentKey of CONTENT_FIELD_CANDIDATES) {
      const gql = /* GraphQL */ `
        mutation ${name[0].toUpperCase() + name.slice(1)}($input: ${input}!) {
          ${name}(input: $input) ${MUTATION_SELECTION}
        }
      `
      // Return the first candidate; caller will loop through candidates and try sequentially.
      return { mode: 'auto', gql, contentFieldKey: contentKey, nameHint: `${name}(${input}) · content="${contentKey}"` }
    }
  }

  return null
}

// Slug lookup query (if you have codegen)
function pickSlugLookup():
  | { name: string; op: any; buildVars: (slug: string) => any }
  | null {
  if (CUSTOM_OPS.bySlugQueryKey) {
    const op = (GenQueries as any)[CUSTOM_OPS.bySlugQueryKey]
    if (op) return { name: CUSTOM_OPS.bySlugQueryKey, op, buildVars: (slug) => ({ slug, limit: 1 }) }
  }
  if (CUSTOM_OPS.listPostsQueryKey) {
    const op = (GenQueries as any)[CUSTOM_OPS.listPostsQueryKey]
    if (op) return { name: CUSTOM_OPS.listPostsQueryKey, op, buildVars: (slug) => ({ limit: 1, filter: { slug: { eq: slug } } }) }
  }
  const auto = Object.keys(GenQueries).find(k => /^list.*Posts?$/i.test(k))
  if (auto) return { name: auto, op: (GenQueries as any)[auto], buildVars: (slug) => ({ limit: 1, filter: { slug: { eq: slug } } }) }
  console.warn('ℹ️ No slug lookup query present; slug will be timestamped for uniqueness.')
  return null
}

// ────────────────────────────────────────────────────────────────────────────────

export default function Ask() {
  const router = useRouter()

  // form
  const [title, setTitle] = useState('')
  const [contentMD, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [type, setType] = useState<PostType>('QUESTION')

  // ui/auth
  const [isSubmitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [authedUserId, setAuthedUserId] = useState<string | null>(null)

  // mount
  useEffect(() => {
    console.groupCollapsed('🧩 Ask page mounted')
    console.log('Path:', router.asPath)
    console.log('Env NEXT_PUBLIC_COMMUNITY_API_NAME:', FORCED_API_NAME || '(not set)')
    console.log('GenMutations keys:', Object.keys(GenMutations))
    console.log('GenQueries keys:', Object.keys(GenQueries))

    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const d: Draft = JSON.parse(raw)
        setTitle(d.title || '')
        setContent(d.contentMD || '')
        setTags(d.tags || '')
        setType((d.type as PostType) || 'QUESTION')
        console.log('📝 Draft restored')
      }
    } catch (e) {
      console.warn('⚠️ Failed to parse saved draft', e)
    }

    ;(async () => {
      try {
        const u = await getCurrentUser()
        setIsAuthed(true)
        setAuthedUserId(u?.userId ?? null)
        console.log('🔐 user present at mount', { userId: u?.userId, username: u?.username })
      } catch {
        setIsAuthed(false)
        setAuthedUserId(null)
        console.log('🔒 no user at mount')
      } finally {
        setAuthChecked(true)
        console.groupEnd()
      }
    })()
  }, [router.asPath])

  // persist draft
  useEffect(() => {
    const draft: Draft = { title, contentMD, tags, type }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch (e) {
      console.warn('⚠️ Failed to save draft', e)
    }
  }, [title, contentMD, tags, type])

  // validation
  function validate(): string | null {
    if (!title.trim()) return 'Title is required.'
    if (title.trim().length > MAX_TITLE) return `Title is too long (max ${MAX_TITLE} chars).`
    if (!contentMD.trim()) return 'Details are required.'
    if (contentMD.length > MAX_BODY) return `Details exceed ${MAX_BODY} characters.`
    const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean)
    if (tagArray.length > MAX_TAGS) return `Please use at most ${MAX_TAGS} tags.`
    return null
  }

  // slug uniqueness
  async function ensureUniqueSlug(baseSlug: string): Promise<string> {
    const lookup = pickSlugLookup()
    if (!lookup) return `${baseSlug}-${Date.now()}`
    const client = getCommunityClient()
    try {
      const res = await client.graphql({
        query: lookup.op,
        variables: lookup.buildVars(baseSlug),
        authMode: 'userPool',
      } as any)
      const items = (res as any)?.data?.[lookup.name]?.items
      if (!Array.isArray(items) || items.length === 0) return baseSlug
      return `${baseSlug}-2`
    } catch (e) {
      console.warn('ℹ️ Slug lookup failed, timestamping.', e)
      return `${baseSlug}-${Date.now()}`
    }
  }

  // submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = validate()
    if (v) { setErrorMsg(v); return }

    setSubmitting(true)
    setErrorMsg(null)
    setHint(null)
    console.time?.('⏱ createPost')

    const rawSlug = slugify(title, { lower: true, strict: true })
    const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean)

    try {
      let userId = authedUserId
      if (!userId) {
        try {
          const u = await getCurrentUser()
          userId = u?.userId ?? null
          console.log('🔐 getCurrentUser() at submit', { userId, username: u?.username })
        } catch {
          setErrorMsg('Please sign in to post.')
          router.push(`/signin?next=${encodeURIComponent(router.asPath)}`)
          setSubmitting(false)
          return
        }
      }

      const base = {
        owner: userId,
        type,
        title: title.trim(),
        contentMD,
        tags: tagArray,
        score: 0,
        answersCount: 0,
        slug: await ensureUniqueSlug(rawSlug),
      }

      const client = getCommunityClient()

      // 1) Try configured/raw
      const firstPick = pickCreateMutation()
      const picks: Array<{ gql: any; name: string; contentKey: string }> = []

      if (firstPick) {
        picks.push({ gql: firstPick.gql, name: `${firstPick.mode}:${firstPick.nameHint || ''}`, contentKey: firstPick.contentFieldKey })
      }

      // 2) If in AUTO mode, queue *all* candidates so we try multiple combos
      if (!firstPick || firstPick.mode === 'auto') {
        // push the rest of the combos after the first
        for (const { name, input } of MUTATION_NAME_CANDIDATES) {
          for (const contentKey of CONTENT_FIELD_CANDIDATES) {
            const gql = /* GraphQL */ `
              mutation ${name[0].toUpperCase() + name.slice(1)}($input: ${input}!) {
                ${name}(input: $input) ${MUTATION_SELECTION}
              }
            `
            const label = `auto:${name}(${input})·content="${contentKey}"`
            if (!picks.some(p => p.name === label)) picks.push({ gql, name: label, contentKey })
          }
        }
      }

      // Attempt sequentially until one works
      let created: any = null
      const errors: string[] = []

      for (const p of picks) {
        try {
          const input = buildInput(base, p.contentKey)
          console.log('🧪 Try mutation →', p.name, '| input keys:', Object.keys(input))
          const { data } = await client.graphql({
            query: p.gql,
            variables: { input },
            authMode: 'userPool',
          } as any)
          created =
            (data as any)?.createCommunityPost ??
            (data as any)?.createPost ??
            (Object.values(data || {})[0] as any)
          if (created) {
            console.log('✅ Success with', p.name, '→', created)
            break
          } else {
            errors.push(`No payload from ${p.name}`)
          }
        } catch (err: any) {
          const msg = err?.errors?.[0]?.message || err?.message || String(err)
          console.warn('❌ Mutation failed:', p.name, msg)
          errors.push(`${p.name}: ${msg}`)
        }
      }

      if (!created) {
        setErrorMsg('Setup needed: Community GraphQL mutation not configured.')
        setHint(
          'None of the common create mutations succeeded.\n' +
          '- If you have codegen for the Community API, set CUSTOM_OPS.createMutationKey to the exact name (e.g., createCommunityPost).\n' +
          '- Or paste your exact RAW_CREATE_MUTATION (input type + fields).\n' +
          (FORCED_API_NAME ? '' : '- Tip: set NEXT_PUBLIC_COMMUNITY_API_NAME to the Community API name if your app has multiple APIs.\n') +
          `Attempts:\n${errors.join('\n')}`
        )
        return
      }

      const newSlug = created?.slug || base.slug
      ;(window as any)?.latimere?.trackCommunity?.('post_created', { slug: newSlug })
      try { localStorage.removeItem(DRAFT_KEY) } catch {}
      router.push(`/community/post/${newSlug}`)
    } catch (err: any) {
      console.error('❌ Failed to create community post', err)
      setErrorMsg(err?.errors?.[0]?.message || err?.message || 'Something went wrong creating your post.')
    } finally {
      console.timeEnd?.('⏱ createPost')
      setSubmitting(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isSubmitting) {
      ;(e.target as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    }
  }

  const titleLeft = MAX_TITLE - title.length
  const bodyLeft = MAX_BODY - contentMD.length
  const liveSlug = useMemo(() => slugify(title || 'your-title', { lower: true, strict: true }), [title])

  function addTag(t: string) {
    const current = tags.split(',').map((x) => x.trim())
    if (!current.filter(Boolean).includes(t)) setTags([...current.filter(Boolean), t].join(', '))
  }

  // ───────────────────────── UI ─────────────────────────
  return (
    <>
      <Head>
        <title>Ask a Question · Latimere Community</title>
        <meta name="description" content="Ask the Latimere Community for short-term rental advice." />
      </Head>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">Ask the Latimere Community</h1>
            <p className="text-sm text-slate-600">
              Your URL will be:{' '}
              <code className="rounded bg-slate-50 px-2 py-0.5 text-slate-700">/community/post/{liveSlug}</code>
            </p>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-gradient-to-br from-cyan-50 to-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Level up your STR business</h3>
            <p className="mt-2 text-sm text-slate-600">
              Book a 20-minute consult with Latimere to optimize pricing, ops, and guest experience.
            </p>
            <div className="mt-4">
              <CTA
                title=""
                body=""
                buttonLabel="Book a consult"
                href="/hosting#consult"
                utm={{ utm_source: 'community', utm_medium: 'sidebar', utm_campaign: 'consult' }}
                eventLabel="community_sidebar_consult"
                variant="accent"
              />
            </div>
          </aside>
        </div>

        {authChecked && !isAuthed && (
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 p-3 text-sm">
            You’re not signed in.{' '}
            <Link className="underline font-medium" href={`/signin?next=${encodeURIComponent(router.asPath)}`}>
              Sign in to post
            </Link>
            .
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-3">
          <form
            onSubmit={handleSubmit}
            onKeyDown={onKeyDown}
            className="md:col-span-2 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Post Type</label>
              <select
                className="w-full rounded-xl border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                value={type}
                onChange={(e) => setType(e.target.value as PostType)}
              >
                <option value="QUESTION">Question</option>
                <option value="DISCUSSION">Discussion</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
                placeholder="e.g., How do you handle steep driveways for guests?"
                className="w-full rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
              <div className="mt-1 text-xs text-slate-500">{titleLeft} characters left</div>
            </div>

            <div>
              <MarkdownEditor
                value={contentMD}
                onChange={(v) => setContent(v.slice(0, MAX_BODY))}
                placeholder="Describe your issue, tips, or discussion topic here..."
                label="Details (Markdown supported) *"
                minRows={10}
                maxRows={24}
              />
              <div className="mt-1 text-xs text-slate-500">{bodyLeft} characters left</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., cleaning, pricing, marketing"
                className="w-full rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
              <p className="mt-1 text-xs text-slate-500">
                Separate with commas (max {MAX_TAGS}). Example: cleaning, automation, cohosting
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SUGGESTED_TAGS.map((t) => (
                  <button type="button" key={t} onClick={() => addTag(t)} className="text-xs rounded-full bg-slate-100 px-2 py-1 hover:bg-slate-200">
                    #{t}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-3 text-sm">{errorMsg}</div>}
            {hint && <div className="rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 text-xs whitespace-pre-wrap">{hint}</div>}

            <div className="flex items-center justify-between">
              <Link href="/community" className="text-slate-600 hover:underline">← Back to Community</Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`rounded-2xl shadow px-4 py-2 text-slate-900 transition ${isSubmitting ? 'bg-slate-300 cursor-not-allowed' : 'bg-cyan-400 hover:shadow-md'}`}
                onClick={() => (window as any)?.latimere?.trackCTA?.('ask_submit')}
              >
                {isSubmitting ? 'Posting…' : 'Post Question'}
              </button>
            </div>
          </form>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Tips for great questions</h3>
              <ul className="mt-3 list-disc pl-5 text-sm text-slate-600 space-y-1">
                <li>Use a clear, specific title.</li>
                <li>Share what you tried and where you’re stuck.</li>
                <li>Add relevant details (dates, tools, platforms).</li>
                <li>Tag with topics you want experts to see.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Why Latimere?</h3>
              <p className="mt-2 text-sm text-slate-600">
                We actively manage STRs in Sevierville, Pigeon Forge, and Gatlinburg and share what actually works.
              </p>
              <Link href="/hosting" className="mt-4 inline-block rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:opacity-90">
                Explore Hosting Services
              </Link>
            </div>

            {process.env.NODE_ENV !== 'production' && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-xs text-indigo-900">
                <div className="font-semibold mb-1">Dev diagnostics</div>
                <div>Mutations: <pre className="whitespace-pre-wrap break-words">{JSON.stringify(Object.keys(GenMutations), null, 2)}</pre></div>
                <div>Queries:   <pre className="whitespace-pre-wrap break-words">{JSON.stringify(Object.keys(GenQueries), null, 2)}</pre></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

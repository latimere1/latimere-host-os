// components/community/PostCard.tsx
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'

type PostType = 'QUESTION' | 'DISCUSSION'

export type PostCardProps = {
  id: string
  type: PostType
  title: string
  slug: string
  tags?: string[]
  score?: number
  answersCount?: number
  acceptedAnswerId?: string | null
  createdAt?: string | null
  compact?: boolean              // optional smaller style
  className?: string
}

// Lazy-load VoteWidget on the client only (prevents SSR import issues)
const VoteWidget = dynamic(() => import('./VoteWidget').then(m => m.default), {
  ssr: false,
  loading: () => null,
})

/**
 * PostCard
 * - Displays title, meta (score/answers/type), tags
 * - Highlights accepted answer state
 * - Emits CTA telemetry when opened
 * - Integrates VoteWidget (optimistic voting UI)
 */
export default function PostCard({
  id,
  type,
  title,
  slug,
  tags = [],
  score = 0,
  answersCount = 0,
  acceptedAnswerId,
  createdAt,
  compact = false,
  className = '',
}: PostCardProps) {
  const created = useMemo(() => {
    try {
      return createdAt ? new Date(createdAt).toLocaleString() : ''
    } catch {
      return ''
    }
  }, [createdAt])

  const typeBadge = type === 'QUESTION' ? 'Question' : 'Discussion'
  const accepted = !!acceptedAnswerId

  if (process.env.NODE_ENV !== 'production') {
    // One-time render log (makes triage easier without spamming)
    console.debug('🧱 <PostCard> render', {
      id,
      slug,
      score,
      answersCount,
      accepted,
      compact,
    })
  }

  return (
    <article
      className={[
        'rounded-2xl shadow bg-white text-slate-900',
        compact ? 'p-3' : 'p-4',
        className,
      ].join(' ')}
      data-post-id={id}
      itemScope
      itemType="https://schema.org/Article"
    >
      {/* Header row: meta + vote control */}
      <div className="mb-2 flex items-start gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-2 py-0.5" itemProp="articleSection">
            {typeBadge}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5">Score: {score}</span>
          <span
            className={[
              'rounded-full px-2 py-0.5',
              accepted ? 'bg-green-100 text-green-700' : 'bg-slate-100',
            ].join(' ')}
            aria-label={accepted ? 'Accepted answer exists' : 'Answer count'}
          >
            {accepted ? 'Accepted Answer' : `Answers: ${answersCount}`}
          </span>
          {created && (
            <time
              className="rounded-full bg-slate-100 px-2 py-0.5"
              dateTime={createdAt || undefined}
              itemProp="dateCreated"
            >
              {created}
            </time>
          )}
        </div>

        {/* Spacer */}
        <div className="ml-auto" />

        {/* Vote widget (client-only) */}
        <div className="shrink-0">
          <VoteWidget
            kind="post"
            id={id}
            initialScore={score ?? 0}
            onChange={(s, v) => {
              // lightweight client log for debugging
              console.log('🗳 post vote change', { id, score: s, myVote: v })
            }}
          />
        </div>
      </div>

      {/* Title */}
      <h3 className={`font-medium ${compact ? 'text-lg' : 'text-xl'}`} itemProp="headline">
        <Link
          href={`/community/post/${slug}`}
          className="hover:underline"
          onClick={() => (window as any)?.latimere?.trackCTA?.('open_post', { slug })}
          itemProp="url"
        >
          {title}
        </Link>
      </h3>

      {/* Tags */}
      {tags?.length ? (
        <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600" itemProp="keywords">
          {tags.slice(0, 6).map((t) => (
            <Link
              key={`${id}-${t}`}
              href={{ pathname: '/community', query: { tag: t } }}
              className="rounded-full bg-slate-100 px-2 py-0.5 hover:bg-slate-200"
              title={`Filter by #${t}`}
              onClick={() => console.info('🏷️ tag click', { tag: t, from: 'PostCard' })}
            >
              #{t}
            </Link>
          ))}
          {tags.length > 6 && <span className="text-slate-500">+{tags.length - 6} more</span>}
        </div>
      ) : null}

      {/* Debug snapshot (hidden on prod) */}
      {process.env.NODE_ENV !== 'production' && (
        <pre className="mt-3 hidden whitespace-pre-wrap break-words text-xs text-slate-500 md:block">
{JSON.stringify({ id, slug, score, answersCount, accepted }, null, 0)}
        </pre>
      )}
    </article>
  )
}

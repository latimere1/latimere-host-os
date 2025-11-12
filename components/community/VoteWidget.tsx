// components/community/VoteWidget.tsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { API } from 'aws-amplify'
import * as GenMutations from '@/graphql/mutations' // optional; safe if absent

type VoteKind = 'post' | 'answer'
type Props = {
  kind: VoteKind
  id: string
  initialScore: number
  /** If you already know user's previous vote (-1|0|1), pass it; otherwise we'll load from localStorage */
  initialMyVote?: -1 | 0 | 1
  /** Called after a successful server update; gives final score + myVote */
  onChange?: (score: number, myVote: -1 | 0 | 1) => void
  /** Disable voting (e.g., while not authenticated) */
  disabled?: boolean
  /** Additional classes for outer wrapper */
  className?: string
}

const STORAGE_PREFIX = 'latimere.vote'

/**
 * VoteWidget
 * - Works for Post and Answer
 * - Prefers custom mutations votePost/voteAnswer if they exist in codegen
 * - Fallback: updatePost/updateAnswer with new score
 * - Uses localStorage to remember the user's vote per item (basic prevention against double-votes)
 */
export default function VoteWidget({
  kind,
  id,
  initialScore,
  initialMyVote = 0,
  onChange,
  disabled,
  className = '',
}: Props) {
  const storageKey = useMemo(() => `${STORAGE_PREFIX}.${kind}.${id}`, [kind, id])

  const [score, setScore] = useState(initialScore)
  const [myVote, setMyVote] = useState<-1 | 0 | 1>(initialMyVote)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Load persisted vote if caller didn't provide one
  useEffect(() => {
    if (initialMyVote !== undefined) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const v = JSON.parse(raw)
        if (v === -1 || v === 0 || v === 1) {
          setMyVote(v)
        }
      }
    } catch (e) {
      console.warn('⚠️ VoteWidget: failed to read local vote', { storageKey, e })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  // Keep local score in sync if server-provided value changes upstream
  useEffect(() => {
    setScore(initialScore)
  }, [initialScore])

  // Persist my vote
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(myVote))
    } catch {}
  }, [myVote, storageKey])

  const canVote = !disabled && !loading

  const applyOptimistic = useCallback(
    (nextMyVote: -1 | 0 | 1) => {
      // compute delta relative to current vote
      const delta = nextMyVote - myVote
      return {
        nextScore: score + delta,
        delta,
      }
    },
    [score, myVote]
  )

  async function sendToServer(delta: number, fallbackNewScore: number) {
    setErr(null)

    // Preferred: custom resolvers if present (votePost/voteAnswer with delta)
    const voteMutationName = kind === 'post' ? 'votePost' : 'voteAnswer'
    const updateMutationName = kind === 'post' ? 'updatePost' : 'updateAnswer'

    const voteMutation = (GenMutations as any)?.[voteMutationName]
    const updateMutation = (GenMutations as any)?.[updateMutationName]

    // Diagnostics payload
    const diag = { kind, id, delta, fallbackNewScore }

    // Try custom vote first
    if (voteMutation) {
      try {
        console.log('⬆️ VoteWidget: custom vote mutation (USER_POOLS)', { ...diag, mutation: voteMutationName })
        await API.graphql({
          query: voteMutation,
          variables: { id, delta },
          authMode: 'AMAZON_COGNITO_USER_POOLS',
        })
        console.log('✅ VoteWidget: custom vote success')
        return
      } catch (e1) {
        console.warn('ℹ️ VoteWidget: custom vote failed USER_POOLS; try IAM', e1)
        try {
          await API.graphql({
            query: voteMutation,
            variables: { id, delta },
            authMode: 'AWS_IAM',
          })
          console.log('✅ VoteWidget: custom vote success (IAM)')
          return
        } catch (e2) {
          console.error('❌ VoteWidget: custom vote failed both auth modes', e2)
          throw e2
        }
      }
    }

    // Fallback: updateMutation with new score (optimistic score already computed)
    if (updateMutation) {
      try {
        console.log('🛠️ VoteWidget: fallback update mutation (USER_POOLS)', {
          ...diag,
          mutation: updateMutationName,
        })
        await API.graphql({
          query: updateMutation,
          variables: { input: { id, score: fallbackNewScore } },
          authMode: 'AMAZON_COGNITO_USER_POOLS',
        })
        console.log('✅ VoteWidget: fallback update success')
        return
      } catch (e1) {
        console.warn('ℹ️ VoteWidget: fallback update failed USER_POOLS; try IAM', e1)
        try {
          await API.graphql({
            query: updateMutation,
            variables: { input: { id, score: fallbackNewScore } },
            authMode: 'AWS_IAM',
          })
          console.log('✅ VoteWidget: fallback update success (IAM)')
          return
        } catch (e2) {
          console.error('❌ VoteWidget: fallback update failed both auth modes', e2)
          throw e2
        }
      }
    }

    // If neither codegen mutation exists, log once (non-fatal; UI already updated optimistically)
    console.warn('⚠️ VoteWidget: no suitable mutation found (custom or update). Consider adding vote resolvers.', diag)
  }

  async function handleVote(next: -1 | 0 | 1) {
    if (!canVote) return
    setLoading(true)

    // Compute optimistic changes
    const { nextScore, delta } = applyOptimistic(next)

    // Optimistic UI
    const prev = { score, myVote }
    setScore(nextScore)
    setMyVote(next)

    try {
      await sendToServer(delta, nextScore)
      onChange?.(nextScore, next)
    } catch (e: any) {
      // Roll back
      setScore(prev.score)
      setMyVote(prev.myVote)
      setErr(e?.message || 'Vote failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const upActive = myVote === 1
  const downActive = myVote === -1

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        aria-label="Upvote"
        title="Upvote"
        disabled={!canVote}
        onClick={() => handleVote(upActive ? 0 : 1)}
        className={[
          'h-8 w-8 rounded-full border text-sm transition',
          upActive
            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
            : 'border-white/15 bg-white/5 text-white hover:bg-white/10',
          !canVote && 'opacity-60 cursor-not-allowed',
        ].join(' ')}
      >
        ▲
      </button>

      <span className="min-w-[2ch] text-center tabular-nums" aria-live="polite">
        {score}
      </span>

      <button
        type="button"
        aria-label="Downvote"
        title="Downvote"
        disabled={!canVote}
        onClick={() => handleVote(downActive ? 0 : -1)}
        className={[
          'h-8 w-8 rounded-full border text-sm transition',
          downActive
            ? 'border-rose-400 bg-rose-500/20 text-rose-200'
            : 'border-white/15 bg-white/5 text-white hover:bg-white/10',
          !canVote && 'opacity-60 cursor-not-allowed',
        ].join(' ')}
      >
        ▼
      </button>

      {err && (
        <span className="ml-2 text-xs text-rose-300" role="alert">
          {err}
        </span>
      )}
    </div>
  )
}

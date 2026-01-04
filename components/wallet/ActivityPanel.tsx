// components/wallet/ActivityPanel.tsx
import Link from 'next/link'
import React from 'react'
import { PresentationEvent } from '../../lib/wallet/presentations'
import { WalletReceipt } from '../../lib/wallet/receiptStore'

function verdictBadgeClass(v?: string) {
  const vv = (v || '').toLowerCase()
  if (vv === 'valid') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
  if (vv === 'revoked') return 'border-red-500/30 bg-red-500/10 text-red-200'
  if (vv === 'expired') return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200'
  return 'border-white/10 bg-white/5 text-white/70'
}

type Props = {
  baseUrl: string
  receipts: WalletReceipt[]
  presentations: PresentationEvent[]
  onRefreshReceipts: () => void
  onRefreshPresentations: () => void
  onClearAllActivity: () => void
  onDeleteReceipt: (receiptId: string) => void
  onCopy: (label: string, value: string) => Promise<void>
}

export default function ActivityPanel({
  baseUrl,
  receipts,
  presentations,
  onRefreshReceipts,
  onRefreshPresentations,
  onClearAllActivity,
  onDeleteReceipt,
  onCopy,
}: Props) {
  const receiptLink = (r: WalletReceipt) => r.receiptUrl || `${baseUrl}/receipts/${encodeURIComponent(r.receiptId)}`
  const showReceipts = receipts?.length > 0

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h2 className="text-lg font-semibold">Recent activity</h2>
      <p className="mt-1 text-sm text-gray-300">Saved verification receipts (for this browser).</p>

      {showReceipts ? (
        <div className="mt-4 space-y-2">
          {receipts.slice(0, 10).map((r) => {
            const link = receiptLink(r)
            return (
              <div key={r.receiptId} className="rounded-xl border border-white/10 bg-gray-950/40 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{r.title || 'Credential'}</div>
                    <div className="mt-1 text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleString()} • Verifier: {r.verifierName || '—'}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Credential ID: <span className="font-mono">{r.credentialId || '—'}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={`/receipts/${encodeURIComponent(r.receiptId)}`}
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                      >
                        View receipt →
                      </Link>

                      <button
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                        onClick={async () => onCopy('receipt link', link)}
                      >
                        Copy receipt link
                      </button>

                      <button
                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs hover:bg-red-500/20"
                        onClick={() => onDeleteReceipt(r.receiptId)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <span className={['rounded-full border px-2 py-0.5 text-[11px]', verdictBadgeClass(r.verdict)].join(' ')}>
                    {(r.verdict || 'unknown').toUpperCase()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-white/10 bg-gray-950/40 p-4 text-sm text-gray-300">
          No saved receipts yet. Verify something on <Link className="underline" href="/verify">/verify</Link> and click “Save to wallet”.
        </div>
      )}

      {/* Keep legacy presentation feed as a fallback (so nothing “disappears”) */}
      {!showReceipts && presentations.length > 0 && (
        <div className="mt-4 space-y-2">
          {presentations.slice(0, 6).map((p) => (
            <div key={p.id} className="rounded-xl border border-white/10 bg-gray-950/40 p-3">
              <div className="text-sm font-semibold">{p.title || 'Credential'}</div>
              <div className="mt-1 text-xs text-gray-400">{new Date(p.createdAt).toLocaleString()} • Verifier: {p.verifierName || '—'}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10" onClick={onRefreshReceipts}>
          Refresh receipts
        </button>
        <button className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10" onClick={onRefreshPresentations}>
          Refresh legacy
        </button>
        <button className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs hover:bg-red-500/20" onClick={onClearAllActivity}>
          Clear activity
        </button>
      </div>
    </div>
  )
}

// components/wallet/CredentialListPanel.tsx
import Link from 'next/link'
import React from 'react'
import { WalletCredential, isExpired } from '../../lib/wallet/types'
import { StatusMap } from '../../lib/wallet/statusCache'

function statusBadgeClass(v?: string) {
  const vv = (v || '').toLowerCase()
  if (vv === 'active' || vv === 'valid') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
  if (vv === 'revoked') return 'border-red-500/30 bg-red-500/10 text-red-200'
  if (vv === 'expired') return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200'
  return 'border-white/10 bg-white/5 text-white/70'
}

type Props = {
  loaded: boolean
  locked: boolean
  inboxN: number
  credentials: WalletCredential[]
  statusById: StatusMap
  onImportFromClipboard: () => void | Promise<void>
  onCheckStatus: (c: WalletCredential) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  getStatusMeta: (c: WalletCredential) => any
}

export default function CredentialListPanel({
  loaded,
  locked,
  inboxN,
  credentials,
  onImportFromClipboard,
  onCheckStatus,
  onDelete,
  getStatusMeta,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Your credentials</h2>
          <p className="mt-1 text-sm text-gray-300">Status is based on the last check. Signature and expiry are local.</p>
        </div>

        <div className="flex gap-2">
          <Link href="/wallet/inbox" className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
            Inbox{inboxN ? ` (${inboxN})` : ''}
          </Link>

          <button
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-60"
            disabled={locked}
            onClick={() => onImportFromClipboard()}
          >
            Import from clipboard
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {!loaded ? (
          <div className="text-sm text-gray-400">Loading…</div>
        ) : credentials.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-gray-950/40 p-4 text-sm text-gray-300">
            No credentials yet. Add a sample or import JSON/JWT/link.
          </div>
        ) : (
          credentials.map((c) => {
            const expiredLocal = isExpired(c)
            const signed = c.format === 'jws' && !!c.jws
            const st = getStatusMeta(c)
            const statusText = st?.verdict ? String(st.verdict).toUpperCase() : 'UNKNOWN'
            const statusClass = statusBadgeClass(st?.verdict || st?.status || 'unknown')
            const lastChecked = st?.checkedAt ? new Date(st.checkedAt).toLocaleString() : null

            return (
              <div key={c.id} className="rounded-xl border border-white/10 bg-gray-950/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">{c.title}</div>

                      <span className={['rounded-full border px-2 py-0.5 text-[11px]', statusClass].join(' ')}>
                        {statusText}
                      </span>

                      <span
                        className={[
                          'rounded-full border px-2 py-0.5 text-[11px]',
                          expiredLocal ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200' : 'border-white/15 bg-white/5 text-gray-200',
                        ].join(' ')}
                      >
                        {expiredLocal ? 'EXPIRED' : 'NOT EXPIRED'}
                      </span>

                      <span
                        className={[
                          'rounded-full border px-2 py-0.5 text-[11px]',
                          signed ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' : 'border-white/15 bg-white/5 text-gray-200',
                        ].join(' ')}
                      >
                        {signed ? 'SIGNED' : 'UNSIGNED'}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-gray-400">
                      {c.type} · Issuer: {c.issuerName}
                    </div>

                    <div className="mt-1 text-[11px] text-gray-500">
                      Last checked: <span className="text-gray-300">{lastChecked || 'Never'}</span>
                      {st?.reason ? (
                        <>
                          {' '}
                          · <span className="text-gray-400">Reason:</span> <span className="text-gray-300">{st.reason}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link
                      href={`/wallet/credentials/${encodeURIComponent(c.id)}`}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                    >
                      Open
                    </Link>

                    <button
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-60"
                      onClick={() => onCheckStatus(c)}
                      disabled={!signed}
                    >
                      Check status
                    </button>

                    <button
                      className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs hover:bg-red-500/20"
                      onClick={() => onDelete(c.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

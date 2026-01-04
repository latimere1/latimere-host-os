// components/wallet/WalletHeader.tsx
import Link from 'next/link'
import React from 'react'

type Props = {
  locked: boolean
  credentialCount: number
  inboxN: number
  filter: 'all' | 'valid' | 'expired'
  onFilterChange: (v: 'all' | 'valid' | 'expired') => void

  adminKey: string
  onAdminKeyChange: (v: string) => void

  onAddUnsigned: () => void | Promise<void>
  onIssueSigned: () => void | Promise<void>
  onClearAll: () => void | Promise<void>
}

export default function WalletHeader({
  locked,
  credentialCount,
  inboxN,
  filter,
  onFilterChange,
  adminKey,
  onAdminKeyChange,
  onAddUnsigned,
  onIssueSigned,
  onClearAll,
}: Props) {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Free Wallet</h1>
          <p className="mt-2 max-w-prose text-sm text-gray-300">Store credentials locally and share/verify signed proofs with status checks.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/wallet/inbox" className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
            Inbox{inboxN ? ` (${inboxN})` : ''}
          </Link>

          <button
            className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-cyan-400"
            onClick={() => onAddUnsigned()}
          >
            Add unsigned sample
          </button>

          <button
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm hover:bg-cyan-500/20"
            onClick={() => onIssueSigned()}
            title="Uses admin key"
          >
            Issue signed sample
          </button>

          <button className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm hover:bg-red-500/20" onClick={() => onClearAll()}>
            Clear
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-300">
        <span
          className={[
            'inline-flex items-center gap-2 rounded-full border px-3 py-1',
            locked ? 'border-yellow-500/40 bg-yellow-500/10' : 'border-emerald-500/40 bg-emerald-500/10',
          ].join(' ')}
        >
          <span className={['h-2 w-2 rounded-full', locked ? 'bg-yellow-400' : 'bg-emerald-400'].join(' ')} />
          {locked ? 'Locked mode' : 'Unlocked mode'}
        </span>

        <span className="text-gray-400">
          Credentials: <span className="text-gray-200">{credentialCount}</span>
        </span>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-gray-400">Filter</label>
          <select
            className="rounded-lg border border-white/15 bg-gray-900 px-3 py-2 text-sm text-white"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="valid">Not expired</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="text-xs text-gray-400">Issuer admin key (only needed for issuing signed samples)</div>
        <input
          value={adminKey}
          onChange={(e) => onAdminKeyChange(e.target.value)}
          placeholder="Admin key"
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
        />
      </div>
    </>
  )
}

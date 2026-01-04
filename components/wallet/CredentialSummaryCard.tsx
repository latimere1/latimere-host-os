// components/wallet/CredentialSummaryCard.tsx
import Link from 'next/link'
import React from 'react'
import { WalletCredential } from '../../lib/wallet/types'
import { CredentialStatusRecord } from '../../lib/wallet/statusCache'

function statusBadgeClass(v?: string) {
  const vv = (v || '').toLowerCase()
  if (vv === 'active' || vv === 'valid') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
  if (vv === 'revoked') return 'border-red-500/30 bg-red-500/10 text-red-200'
  if (vv === 'expired') return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200'
  return 'border-white/10 bg-white/5 text-white/70'
}

type Props = {
  cred: WalletCredential
  signed: boolean
  expiredLocal: boolean
  statusRecord: CredentialStatusRecord | null
  lastChecked: string
  verifyHref: string
  latestReceiptLink: string
  onCheckStatus: () => void | Promise<void>
  onCopy: (v: string) => void | Promise<void>
}

export default function CredentialSummaryCard({
  cred,
  signed,
  expiredLocal,
  statusRecord,
  lastChecked,
  verifyHref,
  latestReceiptLink,
  onCheckStatus,
  onCopy,
}: Props) {
  const statusText = statusRecord?.verdict ? String(statusRecord.verdict).toUpperCase() : 'UNKNOWN'
  const statusClass = statusBadgeClass(statusRecord?.verdict || statusRecord?.status || 'unknown')

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{cred.title}</h2>

            <span className={['rounded-full border px-2 py-0.5 text-[11px]', statusClass].join(' ')}>{statusText}</span>

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

          <div className="mt-2 text-sm text-gray-300">{cred.type}</div>
          <div className="mt-2 text-sm text-gray-300">
            Issuer: <span className="text-gray-200">{cred.issuerName}</span> • Subject:{' '}
            <span className="text-gray-200">{cred.subjectName || '—'}</span>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            ID: <span className="font-mono">{cred.id}</span> • Last checked: <span className="text-gray-300">{lastChecked}</span>
            {statusRecord?.reason ? (
              <>
                {' '}• Reason: <span className="text-gray-300">{statusRecord.reason}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-60"
            onClick={() => onCheckStatus()}
            disabled={!signed}
          >
            Check status
          </button>

          <Link
            href={verifyHref || '/verify'}
            className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-black hover:opacity-90 disabled:opacity-60"
            aria-disabled={!signed}
            onClick={(e) => {
              if (!signed) e.preventDefault()
            }}
            title="Open /verify with this credential"
          >
            Verify now →
          </Link>
        </div>
      </div>

      {latestReceiptLink ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-gray-950/40 p-4">
          <div className="text-xs text-gray-400">Latest receipt</div>
          <div className="mt-1 break-all font-mono text-[11px] text-gray-200">{latestReceiptLink}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
              onClick={() => onCopy(latestReceiptLink)}
            >
              Copy receipt link
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

// components/wallet/ReceiptsForCredential.tsx
import Link from 'next/link'
import React from 'react'
import { toQrDataUrl } from '../../lib/qr/toQrDataUrl'
import { deleteReceipt, WalletReceipt } from '../../lib/wallet/receiptStore'

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
  onCopy: (v: string) => void | Promise<void>
  onAfterDelete: () => void
}

export default function ReceiptsForCredential({ baseUrl, receipts, onCopy, onAfterDelete }: Props) {
  const [qrFor, setQrFor] = React.useState<string>('')
  const [qrDataUrl, setQrDataUrl] = React.useState<string>('')
  const [qrErr, setQrErr] = React.useState<string | null>(null)

  async function toggleQr(r: WalletReceipt) {
    const next = qrFor !== r.receiptId ? r.receiptId : ''
    setQrFor(next)
    setQrDataUrl('')
    setQrErr(null)
    if (!next) return

    const link = r.receiptUrl || `${baseUrl}/receipts/${encodeURIComponent(r.receiptId)}`
    try {
      setQrDataUrl(await toQrDataUrl(link))
    } catch (e: any) {
      setQrErr(e?.message || 'Failed to generate QR.')
    }
  }

  async function onDelete(r: WalletReceipt) {
    const ok = confirm('Delete this receipt from local wallet activity?')
    if (!ok) return
    deleteReceipt(r.receiptId)
    onAfterDelete()
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h3 className="text-sm font-semibold text-gray-200">Receipts for this credential</h3>
      <p className="mt-1 text-sm text-gray-300">Saved verification receipts (local to this browser).</p>

      {receipts.length === 0 ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-gray-950/40 p-4 text-sm text-gray-300">
          No receipts yet. Click “Check status” or verify on <Link className="underline" href="/verify">/verify</Link> and “Save to wallet”.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {receipts.slice(0, 12).map((r) => {
            const link = r.receiptUrl || `${baseUrl}/receipts/${encodeURIComponent(r.receiptId)}`
            return (
              <div key={r.receiptId} className="rounded-xl border border-white/10 bg-gray-950/40 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{new Date(r.createdAt).toLocaleString()}</div>
                    <div className="mt-1 text-xs text-gray-400">Verifier: {r.verifierName || '—'}</div>
                    <div className="mt-1 break-all font-mono text-[11px] text-gray-200">{link}</div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={`/receipts/${encodeURIComponent(r.receiptId)}`}
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                      >
                        View →
                      </Link>

                      <button
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                        onClick={() => onCopy(link)}
                      >
                        Copy link
                      </button>

                      <button
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                        onClick={() => toggleQr(r)}
                      >
                        {qrFor === r.receiptId ? 'Hide QR' : 'Show QR'}
                      </button>

                      <button
                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs hover:bg-red-500/20"
                        onClick={() => onDelete(r)}
                      >
                        Delete
                      </button>
                    </div>

                    {qrFor === r.receiptId && (
                      <div className="mt-3">
                        {qrErr ? (
                          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{qrErr}</div>
                        ) : qrDataUrl ? (
                          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrDataUrl} alt="Receipt QR" className="h-48 w-48" />
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">Generating…</div>
                        )}
                      </div>
                    )}
                  </div>

                  <span className={['rounded-full border px-2 py-0.5 text-[11px]', verdictBadgeClass(r.verdict)].join(' ')}>
                    {(r.verdict || 'unknown').toUpperCase()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

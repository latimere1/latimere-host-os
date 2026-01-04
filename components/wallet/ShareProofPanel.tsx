// components/wallet/ShareProofPanel.tsx
import React from 'react'
import { toQrDataUrl } from '../../lib/qr/toQrDataUrl'

type Props = {
  signed: boolean
  shareUrl: string
  onCopy: (v: string) => void | Promise<void>
}

export default function ShareProofPanel({ signed, shareUrl, onCopy }: Props) {
  const [qrOpen, setQrOpen] = React.useState(false)
  const [qrDataUrl, setQrDataUrl] = React.useState('')
  const [qrErr, setQrErr] = React.useState<string | null>(null)

  async function toggleQr() {
    const next = !qrOpen
    setQrOpen(next)
    setQrDataUrl('')
    setQrErr(null)
    if (!next) return
    if (!shareUrl) return setQrErr('No share link available.')
    try {
      setQrDataUrl(await toQrDataUrl(shareUrl))
    } catch (e: any) {
      setQrErr(e?.message || 'Failed to generate QR.')
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h3 className="text-sm font-semibold text-gray-200">Share (link or QR)</h3>
      <p className="mt-1 text-sm text-gray-300">Share uses hash fragments (#t=) so tokens aren’t in server URL logs.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10 disabled:opacity-60"
          onClick={() => shareUrl && onCopy(shareUrl)}
          disabled={!shareUrl}
        >
          Copy share link
        </button>

        <button
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10 disabled:opacity-60"
          onClick={toggleQr}
          disabled={!signed || !shareUrl}
        >
          {qrOpen ? 'Hide QR' : 'Show QR'}
        </button>
      </div>

      {shareUrl && (
        <div className="mt-4 rounded-xl border border-white/10 bg-gray-950/40 p-4">
          <div className="text-xs text-gray-400">Share link</div>
          <div className="mt-1 break-all font-mono text-[11px] text-gray-200">{shareUrl}</div>

          {qrOpen && (
            <div className="mt-4">
              {qrErr ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{qrErr}</div>
              ) : qrDataUrl ? (
                <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="Share QR" className="h-56 w-56" />
                </div>
              ) : (
                <div className="text-sm text-gray-400">Generating…</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

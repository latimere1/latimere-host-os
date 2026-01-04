// components/receipts/ReceiptShareCard.tsx
import Link from 'next/link'
import React from 'react'
import { toQrDataUrl } from '../../lib/qr/toQrDataUrl'
import { logInfo, logWarn } from '../../lib/verify/log'
import { upsertReceipt, type WalletReceipt } from '../../lib/wallet/receiptStore'

type ReceiptVerdict = 'valid' | 'revoked' | 'expired' | 'unknown'

type Receipt = {
  receiptId: string
  createdAt: string
  receiptUrl?: string
  verifier?: { name?: string }
  result?: {
    signatureValid: boolean
    status: string
    expired: boolean
    verdict: ReceiptVerdict
    reason?: string | null
  }
  credential?: {
    credentialId: string
    title?: string | null
    issuerName?: string | null
    subjectName?: string | null
  }
  tokenHash?: string | null
  requestId?: string
}

async function copyText(label: string, value: string) {
  if (!navigator.clipboard?.writeText) throw new Error('Clipboard not supported')
  try {
    await navigator.clipboard.writeText(value)
    logInfo('[receipt] copied', { label, len: value.length })
  } catch (e: any) {
    logWarn('[receipt] copy failed', { label, message: e?.message })
    throw e
  }
}

type Props = {
  receipt: Receipt
  receiptUrl: string
  walletCredentialHref: string
  onSaved: () => void
  onError: (msg: string) => void
}

export default function ReceiptShareCard({ receipt, receiptUrl, walletCredentialHref, onSaved, onError }: Props) {
  const [copied, setCopied] = React.useState(false)
  const [qrOpen, setQrOpen] = React.useState(false)
  const [qrDataUrl, setQrDataUrl] = React.useState('')
  const [qrErr, setQrErr] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)

  const onCopyLink = React.useCallback(async () => {
    if (!receiptUrl) return
    try {
      await copyText('receipt link', receiptUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      onError('Failed to copy link. Please copy manually.')
    }
  }, [receiptUrl, onError])

  const onToggleQr = React.useCallback(async () => {
    const next = !qrOpen
    setQrOpen(next)
    setQrDataUrl('')
    setQrErr(null)
    if (!next) return
    if (!receiptUrl) return setQrErr('Missing receipt link.')
    try {
      const png = await toQrDataUrl(receiptUrl)
      setQrDataUrl(png)
    } catch (e: any) {
      setQrErr(e?.message || 'Failed to generate QR')
    }
  }, [qrOpen, receiptUrl])

  const onSaveToWallet = React.useCallback(() => {
    try {
      const wr: WalletReceipt = {
        receiptId: receipt.receiptId,
        createdAt: receipt.createdAt || new Date().toISOString(),
        receiptUrl: receiptUrl || receipt.receiptUrl,
        verifierName: receipt.verifier?.name || 'Verifier',
        verdict: receipt.result?.verdict || 'unknown',
        status: (receipt.result?.status as any) || 'unknown',
        signatureValid: !!receipt.result?.signatureValid,
        expired: !!receipt.result?.expired,
        credentialId: receipt.credential?.credentialId,
        title: receipt.credential?.title || null,
        issuerName: receipt.credential?.issuerName || null,
        subjectName: receipt.credential?.subjectName || null,
        tokenHash: receipt.tokenHash || null,
        requestId: receipt.requestId || null,
      }
      upsertReceipt(wr)
      logInfo('[receipt] saved to wallet receipts', { receiptId: wr.receiptId, credentialId: wr.credentialId, verdict: wr.verdict })
      setSaved(true)
      setTimeout(() => setSaved(false), 1200)
      onSaved()
    } catch (e: any) {
      onError(e?.message || 'Failed to save receipt')
    }
  }, [receipt, receiptUrl, onSaved, onError])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Share / store this receipt</div>
          <div className="mt-1 text-xs text-gray-400 break-all font-mono">{receiptUrl}</div>
          <div className="mt-2 text-xs text-gray-500">Tip: receipts are portable evidence objects. Save it locally to build your audit trail.</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10" onClick={onCopyLink}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>

          <button className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10" onClick={onToggleQr}>
            {qrOpen ? 'Hide QR' : 'Show QR'}
          </button>

          <button className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:opacity-90" onClick={onSaveToWallet}>
            {saved ? 'Saved' : 'Save to wallet'}
          </button>

          {walletCredentialHref ? (
            <Link href={walletCredentialHref} className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
              Open credential →
            </Link>
          ) : null}
        </div>
      </div>

      {qrOpen && (
        <div className="mt-4">
          {qrErr ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{qrErr}</div>
          ) : qrDataUrl ? (
            <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Receipt QR" className="h-56 w-56" />
            </div>
          ) : (
            <div className="text-sm text-gray-400">Generating QR…</div>
          )}
        </div>
      )}
    </div>
  )
}

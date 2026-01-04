// components/receipts/ReceiptEvidenceCard.tsx
import React from 'react'
import { logInfo, logWarn } from '../../lib/verify/log'
import { sha256Hex } from '../../lib/verify/sha256'

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
    schemaId?: string | null
    schemaVersion?: number | null
    orgId?: string | null
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

function downloadJson(filename: string, json: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

type Props = {
  receipt: Receipt
  receiptUrl: string
  onToast: (msg: string) => void
  onError: (msg: string) => void
}

export default function ReceiptEvidenceCard({ receipt, receiptUrl, onToast, onError }: Props) {
  const [hash, setHash] = React.useState<string>('')
  const [hashing, setHashing] = React.useState(false)

  const evidence = React.useMemo(() => {
    // Keep this stable and export-friendly.
    return {
      kind: 'LatimereVerificationReceipt',
      version: 1,
      receiptId: receipt.receiptId,
      receiptUrl: receiptUrl || receipt.receiptUrl || '',
      createdAt: receipt.createdAt,
      verifier: { name: receipt.verifier?.name || 'Verifier' },
      result: {
        verdict: receipt.result?.verdict || 'unknown',
        status: receipt.result?.status || 'unknown',
        signatureValid: !!receipt.result?.signatureValid,
        expired: !!receipt.result?.expired,
        reason: receipt.result?.reason ?? null,
      },
      credential: {
        credentialId: receipt.credential?.credentialId || '',
        title: receipt.credential?.title || null,
        issuerName: receipt.credential?.issuerName || null,
        subjectName: receipt.credential?.subjectName || null,
        schemaId: receipt.credential?.schemaId || null,
        schemaVersion: receipt.credential?.schemaVersion ?? null,
        orgId: receipt.credential?.orgId || null,
      },
      requestId: receipt.requestId || null,
      tokenHash: receipt.tokenHash || null,
    }
  }, [receipt, receiptUrl])

  const evidenceJson = React.useMemo(() => JSON.stringify(evidence, null, 2), [evidence])

  const computeHash = React.useCallback(async () => {
    try {
      setHashing(true)
      const h = await sha256Hex(evidenceJson)
      setHash(h)
      logInfo('[receipt] evidence hash computed', { receiptId: receipt.receiptId })
    } catch (e: any) {
      onError(e?.message || 'Failed to compute evidence hash')
    } finally {
      setHashing(false)
    }
  }, [evidenceJson, receipt.receiptId, onError])

  React.useEffect(() => {
    setHash('')
    setHashing(false)
  }, [evidenceJson])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h2 className="text-lg font-semibold">Evidence export</h2>
      <p className="mt-1 text-sm text-gray-300">Export a portable evidence JSON for audits, incident reviews, and recordkeeping.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          onClick={async () => {
            try {
              await copyText('evidence json', evidenceJson)
              onToast('Copied evidence JSON')
            } catch {
              onError('Failed to copy evidence JSON')
            }
          }}
        >
          Copy JSON
        </button>

        <button
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          onClick={() => {
            try {
              downloadJson(`latimere-receipt-${receipt.receiptId}.json`, evidenceJson)
              onToast('Downloaded evidence JSON')
            } catch (e: any) {
              onError(e?.message || 'Failed to download JSON')
            }
          }}
        >
          Download JSON
        </button>

        <button
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          onClick={computeHash}
          disabled={hashing}
        >
          {hashing ? 'Hashing…' : 'Compute SHA-256'}
        </button>

        {hash ? (
          <button
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            onClick={async () => {
              try {
                await copyText('evidence hash', hash)
                onToast('Copied hash')
              } catch {
                onError('Failed to copy hash')
              }
            }}
          >
            Copy hash
          </button>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-gray-950/40 p-4">
        <div className="text-xs text-gray-400">Evidence JSON (preview)</div>
        <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] text-gray-200">
          {evidenceJson}
        </pre>
      </div>

      {hash ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-gray-950/40 p-4">
          <div className="text-xs text-gray-400">SHA-256 (hex)</div>
          <div className="mt-2 break-all font-mono text-[11px] text-gray-200">{hash}</div>
        </div>
      ) : null}
    </div>
  )
}

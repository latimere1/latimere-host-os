// pages/receipts/[id].tsx
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import TopNav from '../../components/TopNav'
import SiteFooter from '../../components/SiteFooter'
import { getPublicBaseUrl } from '../../lib/urls/baseUrl'
import { logError, logInfo, logWarn } from '../../lib/verify/log'
import ReceiptShareCard from '../../components/receipts/ReceiptShareCard'
import ReceiptEvidenceCard from '../../components/receipts/ReceiptEvidenceCard'

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

function badgeClass(v?: string) {
  const vv = (v || 'unknown').toLowerCase()
  if (vv === 'valid') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
  if (vv === 'revoked') return 'border-red-500/30 bg-red-500/10 text-red-200'
  if (vv === 'expired') return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200'
  return 'border-white/10 bg-white/5 text-white/70'
}

export default function ReceiptPage() {
  const router = useRouter()
  const id = React.useMemo(() => {
    const q = router.query?.id
    if (typeof q === 'string') return q
    if (Array.isArray(q) && q[0]) return q[0]
    return ''
  }, [router.query])

  const baseUrl = React.useMemo(() => getPublicBaseUrl(), [])

  const [loading, setLoading] = React.useState(true)
  const [err, setErr] = React.useState<string | null>(null)
  const [receipt, setReceipt] = React.useState<Receipt | null>(null)

  const [toast, setToast] = React.useState<string | null>(null)

  const receiptUrl = React.useMemo(() => {
    if (!id) return ''
    if (receipt?.receiptUrl) return receipt.receiptUrl
    return `${baseUrl}/receipts/${encodeURIComponent(id)}`
  }, [baseUrl, id, receipt?.receiptUrl])

  const walletCredentialHref = React.useMemo(() => {
    const cid = receipt?.credential?.credentialId
    if (!cid) return ''
    return `/wallet/credentials/${encodeURIComponent(cid)}`
  }, [receipt?.credential?.credentialId])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!router.isReady) return
      if (!id) return

      setLoading(true)
      setErr(null)
      setReceipt(null)

      try {
        logInfo('[receipt] fetching', { id })
        const res = await fetch(`/api/receipt?receiptId=${encodeURIComponent(id)}`)
        const text = await res.text()
        const data = (() => {
          try {
            return JSON.parse(text)
          } catch {
            return null
          }
        })()

        if (!res.ok) {
          const msg = data?.error || 'Receipt not found'
          if (!cancelled) setErr(msg)
          logWarn('[receipt] fetch failed', { id, status: res.status, msg })
          return
        }

        if (!cancelled) {
          setReceipt(data as Receipt)
          logInfo('[receipt] loaded', { id, verdict: (data as any)?.result?.verdict })
        }
      } catch (e: any) {
        logError('[receipt] fetch error', { id, message: e?.message })
        if (!cancelled) setErr('Failed to load receipt')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router.isReady, id])

  const verdict = receipt?.result?.verdict || 'unknown'
  const showNotFoundHint = !!err && err.toLowerCase().includes('not found')

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 1400)
  }

  return (
    <>
      <Head>
        <title>Latimere • Receipt</title>
        <meta name="description" content="Verification receipt" />
      </Head>

      <div className="min-h-screen bg-gray-950 text-white">
        <TopNav />

        <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Verification receipt</h1>
              <p className="mt-2 text-sm text-gray-300">Proof that a verifier checked a credential at a point in time.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/verify" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                Back to verify →
              </Link>
              <Link href="/wallet" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                Open wallet →
              </Link>
            </div>
          </div>

          {(toast || err) && (
            <div
              className={[
                'mt-6 rounded-lg border px-3 py-2 text-sm',
                err ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
              ].join(' ')}
              role={err ? 'alert' : 'status'}
            >
              {err || toast}
              {err && showNotFoundHint && (
                <div className="mt-2 text-xs text-red-200/80">
                  If you’re in dev mode without <span className="font-mono">LATIMERE_RECEIPT_TABLE</span>, receipts may disappear after a server restart.
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="mt-10 text-sm text-gray-400">Loading…</div>
          ) : !receipt ? null : (
            <div className="mt-8 space-y-6">
              <ReceiptShareCard
                receipt={receipt}
                receiptUrl={receiptUrl}
                walletCredentialHref={walletCredentialHref}
                onSaved={() => flash('Saved to wallet')}
                onError={(m) => setErr(m)}
              />

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-gray-400">Receipt ID</div>
                    <div className="mt-1 font-mono text-xs text-gray-200">{receipt.receiptId}</div>

                    <div className="mt-3 text-sm text-gray-400">Created</div>
                    <div className="mt-1 text-sm text-gray-200">{new Date(receipt.createdAt).toLocaleString()}</div>

                    <div className="mt-3 text-sm text-gray-400">Verifier</div>
                    <div className="mt-1 text-sm text-gray-200">{receipt.verifier?.name || 'Unknown verifier'}</div>
                  </div>

                  <span className={['rounded-full border px-3 py-1 text-xs font-semibold', badgeClass(verdict)].join(' ')}>
                    {String(verdict).toUpperCase()}
                  </span>
                </div>

                {receipt.result?.reason ? (
                  <div className="mt-4 rounded-xl border border-white/10 bg-gray-950/40 p-4 text-sm text-gray-200">
                    <div className="text-xs text-gray-400">Reason</div>
                    <div className="mt-1">{receipt.result.reason}</div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-lg font-semibold">Credential</h2>
                <div className="mt-3 text-sm text-gray-300">
                  <div className="font-semibold text-gray-100">{receipt.credential?.title || 'Credential'}</div>
                  <div className="mt-1">
                    Subject: <span className="text-gray-100">{receipt.credential?.subjectName || '—'}</span> • Issuer:{' '}
                    <span className="text-gray-100">{receipt.credential?.issuerName || '—'}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Credential ID: <span className="font-mono text-gray-200">{receipt.credential?.credentialId}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Schema: <span className="font-mono text-gray-300">{receipt.credential?.schemaId || '—'}</span>
                    {receipt.credential?.schemaVersion != null ? ` v${receipt.credential.schemaVersion}` : ''}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-lg font-semibold">Result</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-gray-950/40 p-4">
                    <div className="text-xs text-gray-400">Signature</div>
                    <div className="mt-1 text-sm text-gray-200">{receipt.result?.signatureValid ? 'Valid' : 'Invalid'}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-gray-950/40 p-4">
                    <div className="text-xs text-gray-400">Status</div>
                    <div className="mt-1 text-sm text-gray-200">{receipt.result?.status || 'unknown'}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-gray-950/40 p-4">
                    <div className="text-xs text-gray-400">Expired</div>
                    <div className="mt-1 text-sm text-gray-200">{receipt.result?.expired ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  Request ID: <span className="font-mono text-gray-300">{receipt.requestId || '—'}</span>
                </div>

                {receipt.tokenHash ? (
                  <div className="mt-2 text-xs text-gray-500">
                    Token hash: <span className="font-mono text-gray-300">{receipt.tokenHash}</span>
                  </div>
                ) : null}
              </div>

              <ReceiptEvidenceCard
                receipt={receipt}
                receiptUrl={receiptUrl}
                onToast={(m) => flash(m)}
                onError={(m) => setErr(m)}
              />
            </div>
          )}
        </main>

        <SiteFooter />
      </div>
    </>
  )
}

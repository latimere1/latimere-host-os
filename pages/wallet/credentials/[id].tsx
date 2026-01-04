// pages/wallet/credentials/[id].tsx
import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import TopNav from '../../../components/TopNav'
import SiteFooter from '../../../components/SiteFooter'

import { createWalletSession, WalletSession } from '../../../lib/wallet/storage'
import { WalletCredential, WalletState, isExpired } from '../../../lib/wallet/types'
import { getPublicBaseUrl } from '../../../lib/urls/baseUrl'

import { CredentialStatusRecord, StatusMap, loadStatusMap, saveStatusMap, upsertStatus } from '../../../lib/wallet/statusCache'
import { addPresentationEvent } from '../../../lib/wallet/presentations'
import { upsertReceipt, listReceipts, type WalletReceipt } from '../../../lib/wallet/receiptStore'

import { logError, logInfo, logWarn } from '../../../lib/verify/log'
import { tokenFingerprint } from '../../../lib/verify/token'

import CredentialSummaryCard from '../../../components/wallet/CredentialSummaryCard'
import ShareProofPanel from '../../../components/wallet/ShareProofPanel'
import ReceiptsForCredential from '../../../components/wallet/ReceiptsForCredential'

function uuid(): string {
  return (globalThis.crypto as any)?.randomUUID?.() || `p_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

async function copyText(value: string) {
  if (!navigator.clipboard?.writeText) throw new Error('Clipboard not supported')
  await navigator.clipboard.writeText(value)
}

export default function WalletCredentialDetailPage() {
  const router = useRouter()
  const baseUrl = React.useMemo(() => getPublicBaseUrl(), [])

  const sessionRef = React.useRef<WalletSession | null>(null)
  const autoCheckedRef = React.useRef<string>('')

  const [loaded, setLoaded] = React.useState(false)
  const [locked, setLocked] = React.useState(false)
  const [state, setState] = React.useState<WalletState>({ version: 1, credentials: [] })

  const [cred, setCred] = React.useState<WalletCredential | null>(null)
  const [statusById, setStatusById] = React.useState<StatusMap>({})

  const [receipts, setReceipts] = React.useState<WalletReceipt[]>([])

  const [statusMsg, setStatusMsg] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const id = React.useMemo(() => {
    const q = router.query?.id
    if (typeof q === 'string') return q
    if (Array.isArray(q) && q[0]) return q[0]
    return ''
  }, [router.query])

  const getSession = () => sessionRef.current
  const signed = !!cred && cred.format === 'jws' && !!cred.jws
  const expiredLocal = !!cred && isExpired(cred)

  const syncReceipts = React.useCallback(() => {
    const all = listReceipts()
    setReceipts(all)
  }, [])

  React.useEffect(() => {
    setStatusById(loadStatusMap())
    syncReceipts()
  }, [syncReceipts])

  // Load credential by ID
  React.useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!router.isReady || !id) return

      if (typeof window !== 'undefined' && !sessionRef.current) {
        sessionRef.current = createWalletSession()
        logInfo('[CredentialDetail] session initialized', { locked: sessionRef.current.locked })
      }

      const sess = getSession()
      if (!sess) {
        setError('Wallet session not available.')
        setLoaded(true)
        return
      }

      try {
        const s = await sess.load()
        if (cancelled) return
        setState(s)
        setLocked(sess.locked)
        setLoaded(true)

        const found = s.credentials.find((x) => String(x.id) === String(id)) || null
        setCred(found)

        if (sess.locked) setError('Wallet is locked. Unlock it on the wallet page to view this credential.')
        else if (!found) setError('Credential not found (or wallet is locked).')
        else setError(null)

        logInfo('[CredentialDetail] loaded', { id, found: !!found, locked: sess.locked, creds: s.credentials.length })
      } catch (e: any) {
        if (cancelled) return
        setLoaded(true)
        setError('Failed to load wallet.')
        logError('[CredentialDetail] load failed', { message: e?.message, name: e?.name })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router.isReady, id])

  const st: CredentialStatusRecord | null = React.useMemo(() => {
    if (!cred) return null
    return statusById[cred.id] || null
  }, [cred, statusById])

  const lastChecked = st?.checkedAt ? new Date(st.checkedAt).toLocaleString() : 'Never'

  const verifyHref = React.useMemo(() => {
    if (!cred?.jws) return ''
    return `/verify#t=${encodeURIComponent(cred.jws)}`
  }, [cred?.jws])

  const shareUrl = React.useMemo(() => {
    if (!cred?.jws) return ''
    return `${baseUrl}/verify#t=${encodeURIComponent(cred.jws)}`
  }, [baseUrl, cred?.jws])

  const receiptsForCred = React.useMemo(() => {
    if (!cred?.id) return []
    const list = receipts.filter((r) => String(r.credentialId || '') === String(cred.id))
    // newest first
    return list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  }, [receipts, cred?.id])

  const latestReceiptLink = React.useMemo(() => {
    const r = receiptsForCred[0]
    if (!r) return ''
    return r.receiptUrl || `${baseUrl}/receipts/${encodeURIComponent(r.receiptId)}`
  }, [baseUrl, receiptsForCred])

  function flashStatus(msg: string) {
    setStatusMsg(msg)
    setTimeout(() => setStatusMsg(null), 1400)
  }

  async function onCopy(value: string) {
    try {
      await copyText(value)
      setError(null)
      flashStatus('Copied.')
    } catch (e: any) {
      setError(e?.message || 'Failed to copy.')
    }
  }

  async function checkStatusNow() {
    if (!cred?.jws) return setError('This credential is unsigned.')

    const verifierName = 'Wallet'
    const token = cred.jws

    try {
      setError(null)
      setStatusMsg(null)

      logInfo('[CredentialDetail] status check -> /api/receipt', { id: cred.id, fp: tokenFingerprint(token) })

      const res = await fetch('/api/receipt', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, verifierName }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok || !data) {
        setError(data?.error || 'Status check failed.')
        logWarn('[CredentialDetail] receipt failed', { httpStatus: res.status, id: cred.id, data })
        return
      }

      const rec: CredentialStatusRecord = {
        credentialId: cred.id,
        checkedAt: new Date().toISOString(),
        verifierName,
        verdict: data?.result?.verdict || 'unknown',
        status: data?.result?.status || 'unknown',
        expired: !!data?.result?.expired,
        signatureValid: !!data?.result?.signatureValid,
        reason: data?.result?.reason ?? null,
      }

      setStatusById((prev) => {
        const next = upsertStatus(prev, rec)
        saveStatusMap(next)
        return next
      })

      // Keep legacy activity log (don’t break current behavior)
      addPresentationEvent({
        id: uuid(),
        createdAt: new Date().toISOString(),
        credentialId: data?.credential?.credentialId || cred.id,
        title: data?.credential?.title || cred.title,
        verifierName,
        verdict: data?.result?.verdict,
        status: data?.result?.status,
        expired: !!data?.result?.expired,
        receiptId: data?.receiptId,
        receiptUrl: data?.receiptUrl,
        requestId: data?.requestId,
      })

      // NEW: Save receipt to the unified receipts store (same as /verify “Save to wallet”)
      if (data?.receiptId) {
        const wr: WalletReceipt = {
          receiptId: String(data.receiptId),
          createdAt: String(data.createdAt || new Date().toISOString()),
          receiptUrl: data.receiptUrl,
          verifierName,
          verdict: data?.result?.verdict || 'unknown',
          status: data?.result?.status || 'unknown',
          signatureValid: !!data?.result?.signatureValid,
          expired: !!data?.result?.expired,
          credentialId: data?.credential?.credentialId || cred.id,
          title: data?.credential?.title || cred.title || null,
          issuerName: data?.credential?.issuerName || cred.issuerName || null,
          subjectName: data?.credential?.subjectName || cred.subjectName || null,
          tokenHash: data?.tokenHash || null,
          requestId: data?.requestId || null,
        }
        upsertReceipt(wr)
        syncReceipts()
        logInfo('[CredentialDetail] saved receipt to wallet receipts', { receiptId: wr.receiptId, verdict: wr.verdict, credentialId: wr.credentialId })
      }

      flashStatus(`Status: ${String(rec.verdict || 'unknown').toUpperCase()}`)
      logInfo('[CredentialDetail] status ok', { id: cred.id, verdict: rec.verdict, receiptId: data?.receiptId })
    } catch (e: any) {
      logError('[CredentialDetail] status check error', { message: e?.message })
      setError('Status check failed.')
    }
  }

  // Auto-check status on open if stale (6h)
  React.useEffect(() => {
    const STALE_MS = 1000 * 60 * 60 * 6
    if (!cred?.id || !cred?.jws) return

    const existing = statusById[cred.id]
    const last = existing?.checkedAt ? new Date(existing.checkedAt).getTime() : 0
    const stale = !last || Date.now() - last > STALE_MS
    if (!stale) return
    if (autoCheckedRef.current === cred.id) return
    autoCheckedRef.current = cred.id
    checkStatusNow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cred?.id])

  return (
    <>
      <Head>
        <title>Latimere • Credential</title>
        <meta name="description" content="View credential details, verify, check status, and manage receipts." />
      </Head>

      <div className="min-h-screen bg-gray-950 text-white">
        <TopNav />

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Credential</h1>
              <p className="mt-2 max-w-prose text-sm text-gray-300">View details, check status, and share proof.</p>
            </div>

            <Link
              href="/wallet"
              className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              ← Back to wallet
            </Link>
          </div>

          {(error || statusMsg) && (
            <div
              className={[
                'mt-6 rounded-lg border px-3 py-2 text-sm',
                error ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
              ].join(' ')}
              role={error ? 'alert' : 'status'}
            >
              {error || statusMsg}
            </div>
          )}

          {!loaded ? (
            <div className="mt-10 text-sm text-gray-400">Loading…</div>
          ) : !cred ? (
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="text-sm text-gray-300">
                {locked ? (
                  <>
                    Wallet is locked. Go to <Link href="/wallet" className="underline">/wallet</Link> to unlock it, then return here.
                  </>
                ) : (
                  <>Credential not found.</>
                )}
              </div>
              <div className="mt-4 text-xs text-gray-500">
                Debug: id=<span className="font-mono">{id || '(missing)'}</span>
              </div>
            </div>
          ) : (
            <div className="mt-10 space-y-6">
              <CredentialSummaryCard
                cred={cred}
                signed={signed}
                expiredLocal={expiredLocal}
                statusRecord={st}
                lastChecked={lastChecked}
                verifyHref={verifyHref}
                latestReceiptLink={latestReceiptLink}
                onCheckStatus={checkStatusNow}
                onCopy={onCopy}
              />

              <ReceiptsForCredential
                baseUrl={baseUrl}
                receipts={receiptsForCred}
                onCopy={onCopy}
                onAfterDelete={syncReceipts}
              />

              <ShareProofPanel
                signed={signed}
                shareUrl={shareUrl}
                onCopy={onCopy}
              />

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h3 className="text-sm font-semibold text-gray-200">Claims</h3>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Object.entries(cred.claims || {}).length === 0 ? (
                    <div className="text-sm text-gray-400">No claims.</div>
                  ) : (
                    Object.entries(cred.claims || {}).map(([k, v]) => (
                      <div key={k} className="rounded-xl border border-white/10 bg-gray-950/40 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{k}</div>
                        <div className="mt-1 text-sm text-gray-200">{String(v)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        <SiteFooter />
      </div>
    </>
  )
}

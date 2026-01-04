// pages/wallet/index.tsx
import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import TopNav from '../../components/TopNav'
import SiteFooter from '../../components/SiteFooter'

import { createWalletSession, WalletSession } from '../../lib/wallet/storage'
import { WalletCredential, WalletState, normalizeCredential, nowIso, isExpired } from '../../lib/wallet/types'
import { credentialFromJwt, looksLikeJwt } from '../../lib/wallet/jwtClient'
import { getPublicBaseUrl } from '../../lib/urls/baseUrl'

import { PresentationEvent, addPresentationEvent, clearPresentations, loadPresentations } from '../../lib/wallet/presentations'
import { CredentialStatusRecord, StatusMap, loadStatusMap, saveStatusMap, upsertStatus, clearStatusMap } from '../../lib/wallet/statusCache'
import { addInboxJwt, inboxCount } from '../../lib/wallet/inboxStore'

import { logError, logInfo, logWarn } from '../../lib/verify/log'
import { extractJwtFromAnyInput, isProbablyJwt, tokenFingerprint } from '../../lib/verify/token'

import { listReceipts, upsertReceipt, clearReceipts, deleteReceipt, type WalletReceipt } from '../../lib/wallet/receiptStore'

import WalletHeader from '../../components/wallet/WalletHeader'
import CredentialListPanel from '../../components/wallet/CredentialListPanel'
import ActivityPanel from '../../components/wallet/ActivityPanel'
import ImportPanel from '../../components/wallet/ImportPanel'

const PENDING_CLAIM_KEY = 'latimere_wallet_pending_claim_v0'

function stashPendingClaim(claim: string) {
  try {
    sessionStorage.setItem(PENDING_CLAIM_KEY, claim)
  } catch {}
}
function takePendingClaim(): string | null {
  try {
    const v = sessionStorage.getItem(PENDING_CLAIM_KEY)
    if (v) sessionStorage.removeItem(PENDING_CLAIM_KEY)
    return v && v.trim() ? v.trim() : null
  } catch {
    return null
  }
}
function clearPendingClaim() {
  try {
    sessionStorage.removeItem(PENDING_CLAIM_KEY)
  } catch {}
}

function readClaimFromHash(): string | null {
  if (typeof window === 'undefined') return null
  const h = window.location.hash || ''
  if (!h) return null
  const raw = h.startsWith('#') ? h.slice(1) : h
  const params = new URLSearchParams(raw)
  const c = params.get('claim')
  return c && c.trim() ? c.trim() : null
}
function clearHash() {
  if (typeof window === 'undefined') return
  if (!window.location.hash) return
  const url = window.location.pathname + window.location.search
  window.history.replaceState({}, document.title, url)
}

function uuid(): string {
  return (globalThis.crypto as any)?.randomUUID?.() || `p_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

async function copyToClipboard(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    logInfo('[Wallet] copied', { label, len: value.length })
  } catch (e: any) {
    logWarn('[Wallet] copy failed', { label, message: e?.message })
    throw e
  }
}

async function issueSignedSample(adminKey: string) {
  const payload = {
    type: 'CertificationCredential',
    title: 'Safety Training (Signed Sample)',
    issuerName: 'Latimere',
    subjectName: 'Jordan Taylor',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
    claims: { course: 'Safety 101', score: 'Passed', level: 'Gold' },
  }

  const resp = await fetch('/api/issue', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-latimere-admin-key': adminKey },
    body: JSON.stringify(payload),
  })

  const j = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error((j as any)?.error || 'Issue failed')

  const token = (j as any).jwt || (j as any).token
  if (!token) throw new Error('Issue succeeded but no jwt/token returned.')

  return { token: String(token), credentialId: String((j as any).credentialId || '') }
}

export default function WalletHome() {
  const router = useRouter()
  const baseUrl = React.useMemo(() => getPublicBaseUrl(), [])
  const sessionRef = React.useRef<WalletSession | null>(null)

  const [loaded, setLoaded] = React.useState(false)
  const [locked, setLocked] = React.useState(false)
  const [state, setState] = React.useState<WalletState>({ version: 1, credentials: [] })
  const [statusMsg, setStatusMsg] = React.useState<string | null>(null)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const [filter, setFilter] = React.useState<'all' | 'valid' | 'expired'>('all')
  const [importText, setImportText] = React.useState('')
  const [adminKey, setAdminKey] = React.useState('')

  const [presentations, setPresentations] = React.useState<PresentationEvent[]>([])
  const [statusById, setStatusById] = React.useState<StatusMap>({})
  const [inboxN, setInboxN] = React.useState(0)
  const [receipts, setReceipts] = React.useState<WalletReceipt[]>([])

  const syncPresentations = React.useCallback(() => setPresentations(loadPresentations()), [])
  const syncStatusMap = React.useCallback(() => setStatusById(loadStatusMap()), [])
  const syncInboxCount = React.useCallback(() => setInboxN(inboxCount()), [])
  const syncReceipts = React.useCallback(() => setReceipts(listReceipts()), [])

  React.useEffect(() => {
    syncPresentations()
    syncStatusMap()
    syncInboxCount()
    syncReceipts()
  }, [syncPresentations, syncStatusMap, syncInboxCount, syncReceipts])

  // /wallet?inbox=<jwtOrLink> -> add to inbox then remove param (shallow)
  React.useEffect(() => {
    if (!router.isReady) return
    const raw = router.query?.inbox
    if (!raw) return

    const v = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : ''
    if (!v) return

    const ex = extractJwtFromAnyInput(v)
    if (!ex?.jwt || !isProbablyJwt(ex.jwt)) {
      logWarn('[Wallet] inbox handoff parse failed', { len: String(v).length })
      setErrorMsg('Inbox handoff did not contain a valid JWT.')
      return
    }

    let preview: any = undefined
    try {
      const cred = credentialFromJwt(ex.jwt) as any
      preview = { credentialId: cred?.id, title: cred?.title, issuerName: cred?.issuerName, subjectName: cred?.subjectName }
    } catch {}

    addInboxJwt(ex.jwt, 'handoff', preview)
    syncInboxCount()
    setStatusMsg('Added to inbox.')
    setTimeout(() => setStatusMsg(null), 1200)

    logInfo('[Wallet] inbox handoff accepted', { via: ex.via, jwtLen: ex.jwt.length })

    const nextQuery = { ...router.query }
    delete (nextQuery as any).inbox
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true }).catch(() => {})
  }, [router.isReady]) // intentionally only on ready

  const getSession = () => sessionRef.current

  async function save(next: WalletState) {
    setState(next)
    const sess = getSession()
    if (!sess) return
    try {
      await sess.save(next)
      setLocked(sess.locked)
      setErrorMsg(null)
      setStatusMsg('Saved.')
      setTimeout(() => setStatusMsg(null), 1200)
    } catch (e: any) {
      setErrorMsg(e?.message || 'Save failed.')
    }
  }

  function visibleCreds() {
    const creds = [...state.credentials].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    if (filter === 'all') return creds
    if (filter === 'expired') return creds.filter((c) => isExpired(c))
    return creds.filter((c) => !isExpired(c))
  }

  function isDuplicateCredential(nextId: string) {
    return state.credentials.some((c) => c.id === nextId)
  }

  async function importJwtToken(rawJwt: string, source: 'hash-claim' | 'paste' | 'issued-sample' | 'pending-claim' | 'clipboard', via?: string) {
    const jwt = (rawJwt || '').trim()
    if (!jwt) return setErrorMsg('Missing token.')

    let cred: WalletCredential | null = null
    try {
      cred = credentialFromJwt(jwt) as any
    } catch (e: any) {
      setErrorMsg('JWT could not be decoded as a Latimere credential.')
      logError('[Wallet] jwt decode threw', { source, via, jwtLen: jwt.length, fp: tokenFingerprint(jwt), message: e?.message })
      return
    }

    if (!cred) return setErrorMsg('JWT could not be decoded as a Latimere credential.')
    if (isDuplicateCredential(cred.id)) {
      setErrorMsg(null)
      setStatusMsg('Credential already exists in wallet.')
      setTimeout(() => setStatusMsg(null), 1400)
      return
    }

    await save({ ...state, credentials: [cred, ...state.credentials] })
    setStatusMsg(source === 'hash-claim' || source === 'pending-claim' ? 'Credential added to wallet.' : 'Imported signed credential.')
    setTimeout(() => setStatusMsg(null), 1400)
    logInfo('[Wallet] imported', { source, via, id: cred.id })
  }

  async function handleIncomingClaim(claimLike: string) {
    const sess = getSession()
    if (!sess) return setErrorMsg('Wallet session not available.')

    const extracted = extractJwtFromAnyInput(claimLike)
    if (!extracted?.jwt) return setErrorMsg('Claim link did not contain a JWT.')
    if (!isProbablyJwt(extracted.jwt)) return setErrorMsg('Claim did not contain a valid JWT.')

    if (sess.locked) {
      setErrorMsg('Wallet is locked. Unlock to accept this credential.')
      stashPendingClaim(claimLike)
      clearHash()
      return
    }

    setErrorMsg(null)
    await importJwtToken(extracted.jwt, 'hash-claim', extracted.via)
  }

  // Initial load + accept hash claim + accept pending claim
  React.useEffect(() => {
    ;(async () => {
      try {
        if (typeof window === 'undefined') return
        if (!sessionRef.current) sessionRef.current = createWalletSession()
        const sess = sessionRef.current

        const s = await sess.load()
        setState(s)
        setLocked(sess.locked)
        setLoaded(true)

        // 1) if full href contains a token/claim, handle it
        const href = window.location.href
        const ex = extractJwtFromAnyInput(href)
        if (ex?.jwt && isProbablyJwt(ex.jwt)) {
          logInfo('[Wallet] claim detected (href)', { via: ex.via })
          await handleIncomingClaim(href)
          clearHash()
          return
        }

        // 2) explicit #claim=
        const hashClaim = readClaimFromHash()
        if (hashClaim) {
          await handleIncomingClaim(hashClaim)
          clearHash()
          return
        }

        // 3) pending claim (wallet was locked)
        const pending = takePendingClaim()
        if (pending) {
          await handleIncomingClaim(pending)
          return
        }
      } catch (e: any) {
        logError('[Wallet] load failed', { message: e?.message })
        setErrorMsg('Failed to load wallet.')
        setLoaded(true)
      }
    })()
  }, [])

  async function addSampleUnsigned() {
    const sample: Partial<WalletCredential> = {
      type: 'CertificationCredential',
      title: 'Safety Training (Unsigned Sample)',
      issuerName: 'Latimere Academy',
      subjectName: 'Jordan Taylor',
      issuedAt: nowIso(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      claims: { course: 'Safety 101', score: 'Passed', badgeLevel: 'Gold' },
      format: 'unsigned',
    }
    await save({ ...state, credentials: [normalizeCredential(sample), ...state.credentials] })
  }

  async function addSampleSigned() {
    setErrorMsg(null)
    setStatusMsg(null)
    if (!adminKey.trim()) return setErrorMsg('Issuer admin key required to issue signed sample.')
    try {
      const j = await issueSignedSample(adminKey.trim())
      await importJwtToken(j.token, 'issued-sample', 'issued-sample')
    } catch (e: any) {
      setErrorMsg(e?.message || 'Issue failed')
    }
  }

  async function removeCredential(id: string) {
    await save({ ...state, credentials: state.credentials.filter((c) => c.id !== id) })
  }

  async function importJsonOrJwt() {
    setErrorMsg(null)
    setStatusMsg(null)
    const raw = importText.trim()
    if (!raw) return setErrorMsg('Paste a JWT token or credential JSON first.')

    if (looksLikeJwt(raw) || isProbablyJwt(raw)) {
      await importJwtToken(raw, 'paste', 'raw-jwt')
      setImportText('')
      return
    }

    const extracted = extractJwtFromAnyInput(raw)
    if (extracted?.jwt && isProbablyJwt(extracted.jwt)) {
      await importJwtToken(extracted.jwt, 'paste', extracted.via)
      setImportText('')
      return
    }

    try {
      const parsed = JSON.parse(raw)
      const asArray = Array.isArray(parsed) ? parsed : [parsed]
      const creds = asArray.map((x) => normalizeCredential(x))
      await save({ ...state, credentials: [...creds, ...state.credentials] })
      setImportText('')
      setStatusMsg(`Imported ${creds.length} credential(s).`)
      setTimeout(() => setStatusMsg(null), 1400)
    } catch {
      setErrorMsg('Invalid JSON or unsupported token/link.')
    }
  }

  async function importFromClipboard() {
    setErrorMsg(null)
    setStatusMsg(null)
    if (locked) return setErrorMsg('Unlock wallet to import from clipboard.')
    if (!navigator.clipboard?.readText) return setErrorMsg('Clipboard read is not supported in this browser.')

    const text = (await navigator.clipboard.readText()).trim()
    if (!text) return setErrorMsg('Clipboard is empty.')

    const extracted = extractJwtFromAnyInput(text)
    if (!extracted?.jwt || !isProbablyJwt(extracted.jwt)) return setErrorMsg('Clipboard does not contain a JWT (or a link containing a JWT).')

    await importJwtToken(extracted.jwt, 'clipboard', extracted.via)
    setStatusMsg('Imported from clipboard.')
    setTimeout(() => setStatusMsg(null), 1400)
  }

  async function checkStatusNow(c: WalletCredential) {
    if (!c?.jws) return setErrorMsg('This credential is unsigned.')

    const token = c.jws
    const verifierName = 'Wallet'

    try {
      setErrorMsg(null)
      const res = await fetch('/api/receipt', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, verifierName }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok || !data) {
        setErrorMsg(data?.error || 'Status check failed.')
        logWarn('[Wallet] receipt failed', { httpStatus: res.status, id: c.id, data })
        return
      }

      // legacy event log (keep existing behavior)
      addPresentationEvent({
        id: uuid(),
        createdAt: new Date().toISOString(),
        credentialId: data?.credential?.credentialId || c.id,
        title: data?.credential?.title || c.title,
        verifierName,
        verdict: data?.result?.verdict,
        status: data?.result?.status,
        expired: !!data?.result?.expired,
        receiptId: data?.receiptId,
        receiptUrl: data?.receiptUrl,
        requestId: data?.requestId,
      })
      syncPresentations()

      // NEW: save receipt into wallet receipts store (unified activity feed)
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
          credentialId: data?.credential?.credentialId || c.id,
          title: data?.credential?.title || c.title || null,
          issuerName: data?.credential?.issuerName || c.issuerName || null,
          subjectName: data?.credential?.subjectName || c.subjectName || null,
          tokenHash: data?.tokenHash || null,
          requestId: data?.requestId || null,
        }
        upsertReceipt(wr)
        syncReceipts()
        logInfo('[Wallet] saved receipt to receipts store', { receiptId: wr.receiptId, verdict: wr.verdict, credentialId: wr.credentialId })
      }

      const rec: CredentialStatusRecord = {
        credentialId: c.id,
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

      setStatusMsg(`Status: ${String(rec.verdict || 'unknown').toUpperCase()}`)
      setTimeout(() => setStatusMsg(null), 1400)
    } catch (e: any) {
      setErrorMsg('Status check failed.')
      logError('[Wallet] status error', { message: e?.message })
    }
  }

  async function onClearAll() {
    const ok = confirm('This deletes all wallet credentials from this browser. Continue?')
    if (!ok) return
    try {
      const sess = getSession()
      if (!sess) return
      clearPendingClaim()
      await sess.clearAll()
      setState({ version: 1, credentials: [] })
      setLocked(false)
      setErrorMsg(null)
      setStatusMsg('Cleared.')

      try {
        clearPresentations()
        clearStatusMap()
        clearReceipts()
      } catch {}

      setPresentations([])
      setStatusById({})
      setReceipts([])
      setTimeout(() => setStatusMsg(null), 1200)
      syncInboxCount()
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to clear wallet.')
    }
  }

  function statusForCredential(c: WalletCredential) {
    return statusById[c.id] || null
  }

  return (
    <>
      <Head>
        <title>Latimere • Wallet</title>
        <meta name="description" content="Free wallet to store and share credentials." />
      </Head>

      <div className="min-h-screen bg-gray-950 text-white">
        <TopNav />

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <WalletHeader
            locked={locked}
            credentialCount={state.credentials.length}
            inboxN={inboxN}
            filter={filter}
            onFilterChange={setFilter}
            adminKey={adminKey}
            onAdminKeyChange={setAdminKey}
            onAddUnsigned={addSampleUnsigned}
            onIssueSigned={addSampleSigned}
            onClearAll={onClearAll}
          />

          {(statusMsg || errorMsg) && (
            <div
              className={[
                'mt-4 rounded-lg border px-3 py-2 text-sm',
                errorMsg ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
              ].join(' ')}
            >
              {errorMsg || statusMsg}
            </div>
          )}

          <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CredentialListPanel
              loaded={loaded}
              locked={locked}
              inboxN={inboxN}
              credentials={visibleCreds()}
              statusById={statusById}
              onImportFromClipboard={importFromClipboard}
              onCheckStatus={checkStatusNow}
              onDelete={removeCredential}
              getStatusMeta={statusForCredential}
            />

            <div className="space-y-6">
              <ActivityPanel
                baseUrl={baseUrl}
                receipts={receipts}
                presentations={presentations}
                onRefreshReceipts={syncReceipts}
                onRefreshPresentations={syncPresentations}
                onClearAllActivity={() => {
                  clearPresentations()
                  clearReceipts()
                  setPresentations([])
                  setReceipts([])
                  setStatusMsg('Cleared activity.')
                  setTimeout(() => setStatusMsg(null), 1200)
                  logInfo('[Wallet] cleared activity (receipts + presentations)')
                }}
                onDeleteReceipt={(receiptId) => {
                  deleteReceipt(receiptId)
                  syncReceipts()
                  setStatusMsg('Deleted receipt.')
                  setTimeout(() => setStatusMsg(null), 1200)
                }}
                onCopy={copyToClipboard}
              />

              <ImportPanel
                importText={importText}
                onChangeImportText={setImportText}
                onImport={importJsonOrJwt}
                inboxN={inboxN}
              />
            </div>
          </section>

          <div className="mt-10 text-xs text-gray-500">
            Tip: claim links can be <span className="font-mono">/wallet#claim=...</span> to auto-add without paste.
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  )
}

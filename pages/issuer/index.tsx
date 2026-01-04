// pages/issuer/index.tsx
import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import TopNav from '../../components/TopNav'
import QRCode from 'qrcode'
import { getPublicBaseUrl } from '../../lib/urls/baseUrl'
import { toQrDataUrl } from '../../lib/qr/toQrDataUrl'

type IssueResp =
  | {
      ok: true
      rid?: string
      orgId?: string
      credentialId: string
      jwt: string
      exp?: number
      claimUrl?: string
      verifyUrl?: string
    }
  | { ok: false; rid?: string; error: string }

type RevokeResp =
  | {
      ok: true
      requestId?: string
      orgId?: string
      credentialId: string
      status: 'revoked'
      reason?: string
      updatedAt?: string | null
      record?: any
    }
  | { ok: false; requestId?: string; error: string }

type Receipt = {
  receiptId: string
  createdAt: string
  receiptUrl?: string
  requestId?: string
  result?: { verdict?: 'valid' | 'revoked' | 'expired' | 'unknown' }
}

function logInfo(msg: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') console.info(msg, data ?? '')
}
function logWarn(msg: string, data?: any) {
  console.warn(msg, data ?? '')
}
function logError(msg: string, data?: any) {
  console.error(msg, data ?? '')
}

function safeJsonParse<T>(s: string): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(s) as T }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Invalid JSON' }
  }
}

function buildWalletClaimPath(jwt: string) {
  return `/wallet#claim=${encodeURIComponent(jwt)}`
}
function buildVerifyPath(jwt: string) {
  return `/verify#t=${encodeURIComponent(jwt)}`
}

function normalizeClaimPath(issueOut: IssueResp | null): string | null {
  if (!issueOut || !issueOut.ok) return null
  if (issueOut.claimUrl && issueOut.claimUrl.trim()) return issueOut.claimUrl.trim()
  return issueOut.jwt ? buildWalletClaimPath(issueOut.jwt) : null
}

function normalizeVerifyPath(issueOut: IssueResp | null): string | null {
  if (!issueOut || !issueOut.ok) return null
  if (issueOut.verifyUrl && issueOut.verifyUrl.trim()) return issueOut.verifyUrl.trim()
  return issueOut.jwt ? buildVerifyPath(issueOut.jwt) : null
}

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    logInfo('[IssuerLite] copied', { label, len: value.length })
    alert(`Copied ${label}.`)
  } catch (e: any) {
    logWarn('[IssuerLite] clipboard failed', { label, message: e?.message })
    alert('Could not copy automatically. Please copy manually.')
  }
}

function badgeHrefFromIssue(issueOut: IssueResp | null, verifyUrlAbs: string) {
  if (!issueOut || !issueOut.ok) return ''
  const q = new URLSearchParams({
    token: issueOut.jwt,
    verifyUrl: verifyUrlAbs || '',
    title: (issueOut as any).title || '',
    issuerName: (issueOut as any).issuerName || '',
    subjectName: (issueOut as any).subjectName || '',
    credentialId: issueOut.credentialId,
    exp: String(issueOut.exp || ''),
  })
  return `/issuer/badge?${q.toString()}`
}

export default function IssuerLitePage() {
  const [adminKey, setAdminKey] = React.useState('')
  const [type, setType] = React.useState('CertificationCredential')
  const [title, setTitle] = React.useState('Safety Training')
  const [issuerName, setIssuerName] = React.useState('Latimere')
  const [subjectName, setSubjectName] = React.useState('Jordan Taylor')
  const [expiresAt, setExpiresAt] = React.useState<string>(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString()
  })
  const [claimsJson, setClaimsJson] = React.useState(
    JSON.stringify({ course: 'Safety 101', score: 'Passed', provider: 'Latimere Academy' }, null, 2)
  )

  const [issueOut, setIssueOut] = React.useState<IssueResp | null>(null)
  const [revokeId, setRevokeId] = React.useState('')
  const [revokeReason, setRevokeReason] = React.useState('Revoked by issuer')
  const [revokeOut, setRevokeOut] = React.useState<RevokeResp | null>(null)

  const [busy, setBusy] = React.useState<string | null>(null)

  const [walletQrPng, setWalletQrPng] = React.useState<string>('')
  const [verifyQrPng, setVerifyQrPng] = React.useState<string>('')
  const [qrErr, setQrErr] = React.useState<string | null>(null)

  // NEW: after revoke, create a receipt so issuer sees “this now verifies as revoked”
  const [revokeReceipt, setRevokeReceipt] = React.useState<Receipt | null>(null)
  const [revokeReceiptQr, setRevokeReceiptQr] = React.useState<string>('')
  const [revokeReceiptErr, setRevokeReceiptErr] = React.useState<string | null>(null)

  const baseUrl = React.useMemo(() => getPublicBaseUrl(), []) // stable per page session

  React.useEffect(() => {
    const saved = sessionStorage.getItem('latimere_admin_key') || ''
    if (saved) setAdminKey(saved)
    logInfo('[IssuerLite] mounted', { hasSavedAdminKey: !!saved, baseUrl })
  }, [baseUrl])

  React.useEffect(() => {
    if (adminKey) sessionStorage.setItem('latimere_admin_key', adminKey)
  }, [adminKey])

  async function issue() {
    setBusy('issue')
    setIssueOut(null)
    setRevokeOut(null)
    setRevokeReceipt(null)
    setRevokeReceiptQr('')
    setRevokeReceiptErr(null)
    setWalletQrPng('')
    setVerifyQrPng('')
    setQrErr(null)

    const parsed = safeJsonParse<Record<string, any>>(claimsJson || '{}')
    if (!parsed.ok) {
      setIssueOut({ ok: false, error: `Claims JSON invalid: ${parsed.error}` })
      setBusy(null)
      return
    }

    try {
      logInfo('[IssuerLite] issuing', { type, title, issuerName, subjectName })

      const r = await fetch('/api/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-latimere-admin-key': adminKey || '',
        },
        body: JSON.stringify({
          type,
          title,
          issuerName,
          subjectName,
          expiresAt: expiresAt || undefined,
          claims: parsed.value,
        }),
      })

      const data = (await r.json().catch(() => null)) as IssueResp | null
      if (!data) {
        setIssueOut({ ok: false, error: 'Invalid response from server' })
        logWarn('[IssuerLite] issue invalid json response', { status: r.status })
        return
      }

      if (data.ok) {
        ;(data as any).title = title
        ;(data as any).issuerName = issuerName
        ;(data as any).subjectName = subjectName
      }

      setIssueOut(data)

      if (data.ok && data.credentialId) setRevokeId(data.credentialId)

      logInfo('[IssuerLite] issued result', {
        ok: data.ok,
        status: r.status,
        credentialId: data.ok ? data.credentialId : undefined,
      })
    } catch (e: any) {
      logError('[IssuerLite] issue failed', { message: e?.message })
      setIssueOut({ ok: false, error: e?.message || 'Issue failed' })
    } finally {
      setBusy(null)
    }
  }

  async function revoke() {
    setBusy('revoke')
    setRevokeOut(null)
    setIssueOut(null)
    setRevokeReceipt(null)
    setRevokeReceiptQr('')
    setRevokeReceiptErr(null)

    try {
      const cid = (revokeId || '').trim()
      if (!cid) {
        setRevokeOut({ ok: false, error: 'Missing credentialId' })
        setBusy(null)
        return
      }

      logInfo('[IssuerLite] revoking', { credentialId: cid })

      const r = await fetch('/api/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-latimere-admin-key': adminKey || '',
        },
        body: JSON.stringify({ credentialId: cid, reason: revokeReason || undefined }),
      })

      const data = (await r.json().catch(() => null)) as RevokeResp | null
      if (!data) {
        setRevokeOut({ ok: false, error: 'Invalid response from server' })
        logWarn('[IssuerLite] revoke invalid json response', { status: r.status })
        return
      }

      setRevokeOut(data)

      logInfo('[IssuerLite] revoke result', {
        ok: data.ok,
        status: r.status,
        credentialId: data.ok ? data.credentialId : cid,
        reason: data.ok ? data.reason : undefined,
      })

      // If we just revoked and we still have the latest JWT from issuing, verify it now to generate a shareable receipt.
      if (data.ok && issueOut && (issueOut as any)?.ok && (issueOut as any)?.jwt) {
        const jwt = (issueOut as any).jwt as string
        await createReceiptForToken(jwt, 'Issuer')
      }
    } catch (e: any) {
      logError('[IssuerLite] revoke failed', { message: e?.message })
      setRevokeOut({ ok: false, error: e?.message || 'Revoke failed' })
    } finally {
      setBusy(null)
    }
  }

  async function createReceiptForToken(jwt: string, verifier: string) {
    try {
      logInfo('[IssuerLite] creating receipt', { tokenLen: jwt.length })
      const r = await fetch('/api/receipt', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: jwt, verifierName: verifier }),
      })
      const data = (await r.json().catch(() => null)) as Receipt | null
      if (!r.ok || !data?.receiptId) {
        setRevokeReceiptErr((data as any)?.error || 'Failed to create receipt')
        logWarn('[IssuerLite] receipt failed', { status: r.status, data })
        return
      }

      setRevokeReceipt(data)
      const url = data.receiptUrl || `${baseUrl}/receipts/${data.receiptId}`
      const png = await toQrDataUrl(url)
      setRevokeReceiptQr(png)

      logInfo('[IssuerLite] receipt ok', { receiptId: data.receiptId, verdict: data?.result?.verdict })
    } catch (e: any) {
      setRevokeReceiptErr(e?.message || 'Failed to create receipt')
    }
  }

  const claimPath = normalizeClaimPath(issueOut)
  const verifyPath = normalizeVerifyPath(issueOut)

  const claimUrlAbs = claimPath ? `${baseUrl}${claimPath.startsWith('/') ? claimPath : `/${claimPath}`}` : ''
  const verifyUrlAbs = verifyPath ? `${baseUrl}${verifyPath.startsWith('/') ? verifyPath : `/${verifyPath}`}` : ''

  React.useEffect(() => {
    ;(async () => {
      try {
        if (!claimUrlAbs && !verifyUrlAbs) return
        setQrErr(null)

        if (claimUrlAbs) {
          const png = await QRCode.toDataURL(claimUrlAbs, { errorCorrectionLevel: 'M', margin: 1, scale: 8 })
          setWalletQrPng(png)
          logInfo('[IssuerLite] wallet QR generated', { len: claimUrlAbs.length })
        } else {
          setWalletQrPng('')
        }

        if (verifyUrlAbs) {
          const png = await QRCode.toDataURL(verifyUrlAbs, { errorCorrectionLevel: 'M', margin: 1, scale: 8 })
          setVerifyQrPng(png)
          logInfo('[IssuerLite] verify QR generated', { len: verifyUrlAbs.length })
        } else {
          setVerifyQrPng('')
        }
      } catch (e: any) {
        logError('[IssuerLite] QR generation failed', { message: e?.message })
        setQrErr('Failed to generate QR codes.')
      }
    })()
  }, [claimUrlAbs, verifyUrlAbs])

  const badgeHref = badgeHrefFromIssue(issueOut, verifyUrlAbs)

  return (
    <div className="min-h-screen bg-[#070B12] text-white">
      <Head>
        <title>Latimere · Issuer Lite</title>
      </Head>

      <TopNav />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Issuer Lite</h1>
        <p className="mt-2 text-sm text-gray-300">
          Issue and revoke signed credentials. Generates share links (Add to Wallet + Verify) and printable badges.
        </p>

        <div className="mt-8 rounded-2xl border border-gray-800 bg-[#0B1220]/70 p-6 shadow">
          <div className="text-sm font-semibold">Admin key</div>
          <div className="mt-1 text-xs text-gray-400">
            Required to call issue/revoke endpoints (<span className="font-mono">x-latimere-admin-key</span>).
          </div>
          <input
            className="mt-3 w-full rounded-lg border border-gray-800 bg-[#08101D] px-3 py-2 text-sm text-white placeholder:text-gray-500"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Paste LATIMERE_ISSUER_ADMIN_KEY"
          />
          <div className="mt-2 text-xs text-gray-500">
            Base URL: <span className="font-mono text-gray-300">{baseUrl}</span> (uses NEXT_PUBLIC_APP_URL if set)
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-gray-800 bg-[#0B1220]/70 p-6 shadow">
            <h2 className="text-lg font-semibold">Issue</h2>

            <div className="mt-4 grid gap-4">
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-400">Type</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-800 bg-[#08101D] px-3 py-2 text-sm"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Title</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-800 bg-[#08101D] px-3 py-2 text-sm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-400">Issuer name</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-800 bg-[#08101D] px-3 py-2 text-sm"
                    value={issuerName}
                    onChange={(e) => setIssuerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Subject name</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-800 bg-[#08101D] px-3 py-2 text-sm"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400">Expires at (optional ISO or date)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-800 bg-[#08101D] px-3 py-2 text-sm"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">Claims JSON</label>
                <textarea
                  className="mt-1 h-40 w-full rounded-lg border border-gray-800 bg-[#08101D] px-3 py-2 text-sm font-mono"
                  value={claimsJson}
                  onChange={(e) => setClaimsJson(e.target.value)}
                />
              </div>

              <button
                onClick={issue}
                disabled={!adminKey || busy === 'issue'}
                className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === 'issue' ? 'Issuing…' : 'Issue'}
              </button>

              {issueOut && (
                <div
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    issueOut.ok ? 'border-emerald-900 bg-emerald-900/20' : 'border-red-900 bg-red-900/20'
                  }`}
                >
                  <div className="font-semibold">{issueOut.ok ? 'Issued' : 'Issue failed'}</div>
                  {!issueOut.ok && <div className="mt-1 text-gray-200">{issueOut.error}</div>}

                  {issueOut.ok && (
                    <div className="mt-2 text-xs text-gray-200">
                      <div>
                        Credential ID: <span className="font-mono">{issueOut.credentialId}</span>
                      </div>

                      {qrErr && (
                        <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">
                          {qrErr}
                        </div>
                      )}

                      {(claimPath || verifyPath) && (
                        <div className="mt-3 grid gap-3">
                          {claimPath && (
                            <div className="rounded-lg border border-gray-800 bg-[#08101D] p-3">
                              <div className="flex flex-wrap items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="text-[11px] text-gray-400">Add to Wallet link</div>
                                  <div className="mt-1 break-all font-mono text-[11px] text-gray-200">{claimUrlAbs}</div>

                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <a
                                      href={claimPath}
                                      className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-cyan-400"
                                      onClick={() => logInfo('[IssuerLite] add-to-wallet clicked', { credentialId: issueOut.credentialId })}
                                    >
                                      Add to Wallet →
                                    </a>
                                    <button
                                      className="rounded-lg border border-gray-800 bg-[#0B1220] px-3 py-2 text-xs hover:bg-[#0E1628]"
                                      onClick={() => copyText('wallet link', claimUrlAbs)}
                                    >
                                      Copy link
                                    </button>
                                  </div>
                                </div>

                                {walletQrPng && (
                                  <div className="shrink-0">
                                    <div className="text-[11px] text-gray-400">QR</div>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={walletQrPng}
                                      alt="Wallet QR"
                                      className="mt-1 h-[220px] w-[220px] rounded-xl border border-white/10 bg-white p-2"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {verifyPath && (
                            <div className="rounded-lg border border-gray-800 bg-[#08101D] p-3">
                              <div className="flex flex-wrap items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="text-[11px] text-gray-400">Verify link</div>
                                  <div className="mt-1 break-all font-mono text-[11px] text-gray-200">{verifyUrlAbs}</div>

                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <a
                                      href={verifyPath}
                                      className="rounded-lg border border-gray-800 bg-[#0B1220] px-3 py-2 text-xs hover:bg-[#0E1628]"
                                      onClick={() => logInfo('[IssuerLite] verify link clicked', { credentialId: issueOut.credentialId })}
                                    >
                                      Verify →
                                    </a>
                                    <button
                                      className="rounded-lg border border-gray-800 bg-[#0B1220] px-3 py-2 text-xs hover:bg-[#0E1628]"
                                      onClick={() => copyText('verify link', verifyUrlAbs)}
                                    >
                                      Copy link
                                    </button>

                                    {badgeHref && (
                                      <Link
                                        href={badgeHref}
                                        className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs hover:bg-cyan-500/20"
                                        onClick={() => logInfo('[IssuerLite] badge opened', { credentialId: issueOut.credentialId })}
                                      >
                                        Print Badge →
                                      </Link>
                                    )}
                                  </div>
                                </div>

                                {verifyQrPng && (
                                  <div className="shrink-0">
                                    <div className="text-[11px] text-gray-400">QR</div>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={verifyQrPng}
                                      alt="Verify QR"
                                      className="mt-1 h-[220px] w-[220px] rounded-xl border border-white/10 bg-white p-2"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {issueOut.jwt && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-400">JWT (debug)</div>
                          <textarea
                            readOnly
                            className="mt-1 h-28 w-full rounded-lg border border-gray-800 bg-[#08101D] px-3 py-2 text-xs font-mono"
                            value={issueOut.jwt}
                          />
                        </div>
                      )}

                      <div className="mt-2 text-[11px] text-gray-400">
                        Tip: share links use hash fragments (<span className="font-mono">#claim</span> / <span className="font-mono">#t</span>)
                        to avoid server URL logs.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-800 bg-[#0B1220]/70 p-6 shadow">
            <h2 className="text-lg font-semibold">Revoke</h2>
            <p className="mt-2 text-sm text-gray-300">Revoke a credentialId, then generate a shareable receipt.</p>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="text-xs text-gray-400">Credential ID</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-800 bg-[#08101D] px-3 py-2 text-sm"
                  value={revokeId}
                  onChange={(e) => setRevokeId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Reason</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-800 bg-[#08101D] px-3 py-2 text-sm"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                />
              </div>

              <button
                onClick={revoke}
                disabled={!adminKey || !revokeId || busy === 'revoke'}
                className="inline-flex items-center justify-center rounded-lg border border-red-900 bg-red-900/20 px-4 py-2 text-sm font-semibold text-white hover:bg-red-900/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === 'revoke' ? 'Revoking…' : 'Revoke'}
              </button>

              {revokeOut && (
                <div
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    revokeOut.ok ? 'border-emerald-900 bg-emerald-900/20' : 'border-red-900 bg-red-900/20'
                  }`}
                >
                  <div className="font-semibold">{revokeOut.ok ? 'Revoked' : 'Revoke failed'}</div>
                  {!revokeOut.ok && <div className="mt-1 text-gray-200">{revokeOut.error}</div>}

                  {revokeOut.ok && (
                    <div className="mt-2 text-xs text-gray-200">
                      <div>
                        Credential ID: <span className="font-mono">{revokeOut.credentialId}</span>
                      </div>
                      <div className="mt-1">
                        Status: <span className="font-mono">{revokeOut.status}</span>
                      </div>
                      {revokeOut.reason && (
                        <div className="mt-1">
                          Reason: <span className="font-mono">{revokeOut.reason}</span>
                        </div>
                      )}
                      {revokeOut.updatedAt && (
                        <div className="mt-1">
                          Updated: <span className="font-mono">{revokeOut.updatedAt}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {(revokeReceiptErr || revokeReceipt) && (
                <div className="rounded-lg border border-white/10 bg-[#08101D] p-3">
                  <div className="text-sm font-semibold">Receipt (proof it verifies as revoked)</div>
                  {revokeReceiptErr ? (
                    <div className="mt-2 text-sm text-red-200">{revokeReceiptErr}</div>
                  ) : (
                    <>
                      <div className="mt-2 text-xs text-gray-200">
                        Receipt ID: <span className="font-mono">{revokeReceipt?.receiptId}</span> • Verdict:{' '}
                        <span className="font-mono">{revokeReceipt?.result?.verdict}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {revokeReceipt?.receiptId && (
                          <Link
                            href={`/receipts/${revokeReceipt.receiptId}`}
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                          >
                            View receipt →
                          </Link>
                        )}
                        {revokeReceipt?.receiptUrl && (
                          <button
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                            onClick={() => copyText('receipt link', revokeReceipt.receiptUrl || '')}
                          >
                            Copy receipt link
                          </button>
                        )}
                      </div>

                      {revokeReceiptQr && (
                        <div className="mt-3">
                          <div className="text-[11px] text-gray-400">Receipt QR</div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={revokeReceiptQr}
                            alt="Receipt QR"
                            className="mt-1 h-[220px] w-[220px] rounded-xl border border-white/10 bg-white p-2"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

// pages/sandbox/index.tsx
import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import TopNav from '../../components/TopNav'
import SiteFooter from '../../components/SiteFooter'
import { getPublicBaseUrl } from '../../lib/urls/baseUrl'
import { toQrDataUrl } from '../../lib/qr/toQrDataUrl'
import { logError, logInfo, logWarn } from '../../lib/verify/log'
import { extractJwtFromAnyInput, isProbablyJwt } from '../../lib/verify/token'
import { requestReceipt, type Receipt } from '../../lib/verify/receiptClient'
import { upsertReceipt, type WalletReceipt } from '../../lib/wallet/receiptStore'

async function copyText(label: string, value: string) {
  if (!navigator.clipboard?.writeText) throw new Error('Clipboard not supported')
  await navigator.clipboard.writeText(value)
  logInfo('[sandbox] copied', { label, len: value.length })
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

  const res = await fetch('/api/issue', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-latimere-admin-key': adminKey },
    body: JSON.stringify(payload),
  })

  const j = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((j as any)?.error || 'Issue failed')

  const token = (j as any).jwt || (j as any).token
  if (!token) throw new Error('Issue succeeded but no jwt/token returned.')

  return { token: String(token), credentialId: String((j as any).credentialId || '') }
}

function codeBlock(s: string) {
  return (
    <pre className="mt-2 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-[11px] text-white/80">
      {s}
    </pre>
  )
}

export default function SandboxPage() {
  const baseUrl = React.useMemo(() => getPublicBaseUrl(), [])

  // Issuing
  const [adminKey, setAdminKey] = React.useState('')
  const [issuedJwt, setIssuedJwt] = React.useState('')
  const [issuedCredentialId, setIssuedCredentialId] = React.useState('')
  const [issueErr, setIssueErr] = React.useState<string | null>(null)
  const [issueMsg, setIssueMsg] = React.useState<string | null>(null)

  // QR (for verify link)
  const [qrOpen, setQrOpen] = React.useState(false)
  const [qrDataUrl, setQrDataUrl] = React.useState('')
  const [qrErr, setQrErr] = React.useState<string | null>(null)

  // Verify tester
  const [verifierName, setVerifierName] = React.useState('Sandbox')
  const [verifyInput, setVerifyInput] = React.useState('')
  const [verifying, setVerifying] = React.useState(false)
  const [verifyErr, setVerifyErr] = React.useState<string | null>(null)
  const [receipt, setReceipt] = React.useState<Receipt | null>(null)
  const [savedToast, setSavedToast] = React.useState<string | null>(null)

  // Revoke tester (optional endpoint)
  const [revokeCredentialId, setRevokeCredentialId] = React.useState('')
  const [revoking, setRevoking] = React.useState(false)
  const [revokeMsg, setRevokeMsg] = React.useState<string | null>(null)
  const [revokeErr, setRevokeErr] = React.useState<string | null>(null)

  const verifyLink = React.useMemo(() => {
    if (!issuedJwt) return ''
    return `${baseUrl}/verify#t=${encodeURIComponent(issuedJwt)}`
  }, [baseUrl, issuedJwt])

  const walletInboxLink = React.useMemo(() => {
    if (!issuedJwt) return ''
    return `${baseUrl}/wallet?inbox=${encodeURIComponent(issuedJwt)}`
  }, [baseUrl, issuedJwt])

  async function onIssueSigned() {
    setIssueErr(null)
    setIssueMsg(null)
    setIssuedJwt('')
    setIssuedCredentialId('')
    setQrOpen(false)
    setQrDataUrl('')
    setQrErr(null)

    const k = adminKey.trim()
    if (!k) {
      setIssueErr('Admin key required to issue signed samples.')
      return
    }

    try {
      logInfo('[sandbox] issuing signed sample')
      const out = await issueSignedSample(k)
      setIssuedJwt(out.token)
      setIssuedCredentialId(out.credentialId)
      setIssueMsg('Issued signed sample.')
      setTimeout(() => setIssueMsg(null), 1200)
      logInfo('[sandbox] issued', { credentialId: out.credentialId, tokenLen: out.token.length })
    } catch (e: any) {
      setIssueErr(e?.message || 'Issue failed')
      logWarn('[sandbox] issue failed', { message: e?.message })
    }
  }

  async function onToggleQr() {
    const next = !qrOpen
    setQrOpen(next)
    setQrDataUrl('')
    setQrErr(null)
    if (!next) return
    if (!verifyLink) {
      setQrErr('Issue or paste a JWT first.')
      return
    }
    try {
      setQrDataUrl(await toQrDataUrl(verifyLink))
    } catch (e: any) {
      setQrErr(e?.message || 'Failed to generate QR')
    }
  }

  async function onVerify() {
    setVerifyErr(null)
    setReceipt(null)

    const raw = verifyInput.trim()
    if (!raw) {
      setVerifyErr('Paste a JWT or a link containing a JWT.')
      return
    }

    const extracted = extractJwtFromAnyInput(raw)
    if (!extracted?.jwt) {
      setVerifyErr('No JWT found in input.')
      return
    }
    if (!isProbablyJwt(extracted.jwt)) {
      setVerifyErr('Extracted token does not look like a JWT.')
      return
    }

    try {
      setVerifying(true)
      logInfo('[sandbox] verify -> requestReceipt', { via: extracted.via, tokenLen: extracted.jwt.length, verifierName })
      const r = await requestReceipt({ token: extracted.jwt, verifierName: verifierName.trim() || 'Sandbox' })
      setReceipt(r)
      logInfo('[sandbox] verify ok', { receiptId: r.receiptId, verdict: r?.result?.verdict })
    } catch (e: any) {
      setVerifyErr(e?.message || 'Verification failed')
      logWarn('[sandbox] verify failed', { message: e?.message })
    } finally {
      setVerifying(false)
    }
  }

  function onSaveReceiptToWallet() {
    if (!receipt?.receiptId) return
    try {
      const wr: WalletReceipt = {
        receiptId: receipt.receiptId,
        createdAt: receipt.createdAt || new Date().toISOString(),
        receiptUrl: receipt.receiptUrl,
        verifierName: receipt.verifier?.name || verifierName || 'Sandbox',
        verdict: receipt.result?.verdict || 'unknown',
        status: receipt.result?.status || 'unknown',
        signatureValid: !!receipt.result?.signatureValid,
        expired: !!receipt.result?.expired,
        credentialId: receipt.credential?.credentialId,
        title: receipt.credential?.title || null,
        issuerName: receipt.credential?.issuerName || null,
        subjectName: receipt.credential?.subjectName || null,
        tokenHash: (receipt as any)?.tokenHash || null,
        requestId: receipt.requestId || null,
      }
      upsertReceipt(wr)
      setSavedToast('Saved to wallet')
      setTimeout(() => setSavedToast(null), 1200)
      logInfo('[sandbox] saved receipt to wallet', { receiptId: wr.receiptId })
    } catch (e: any) {
      setVerifyErr(e?.message || 'Failed to save receipt')
    }
  }

  async function onRevoke() {
    setRevokeErr(null)
    setRevokeMsg(null)
    const cid = revokeCredentialId.trim() || issuedCredentialId.trim()
    const k = adminKey.trim()
    if (!cid) return setRevokeErr('Enter a credentialId to revoke.')
    if (!k) return setRevokeErr('Admin key required to revoke.')

    try {
      setRevoking(true)
      logInfo('[sandbox] revoke request', { credentialId: cid })
      const res = await fetch('/api/revoke', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-latimere-admin-key': k },
        body: JSON.stringify({ credentialId: cid }),
      })

      const text = await res.text()
      const data = (() => {
        try {
          return JSON.parse(text)
        } catch {
          return { raw: text }
        }
      })()

      if (!res.ok) {
        const msg =
          res.status === 404
            ? 'Revoke endpoint not found (/api/revoke). Implement it to test revocation.'
            : (data as any)?.error || 'Revoke failed'
        setRevokeErr(msg)
        logWarn('[sandbox] revoke failed', { status: res.status, msg, data })
        return
      }

      setRevokeMsg('Revoked (or queued) successfully.')
      setTimeout(() => setRevokeMsg(null), 1400)
      logInfo('[sandbox] revoke ok', { credentialId: cid, data })
    } catch (e: any) {
      setRevokeErr(e?.message || 'Revoke failed')
      logError('[sandbox] revoke error', { message: e?.message })
    } finally {
      setRevoking(false)
    }
  }

  const unsignedSample = React.useMemo(() => {
    const obj = {
      type: 'CertificationCredential',
      title: 'Safety Training (Unsigned Sample)',
      issuerName: 'Latimere Academy',
      subjectName: 'Jordan Taylor',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      claims: { course: 'Safety 101', score: 'Passed', badgeLevel: 'Gold' },
      format: 'unsigned',
    }
    return JSON.stringify(obj, null, 2)
  }, [])

  const snippets = React.useMemo(() => {
    const issue = `// Issue (signed sample)
fetch('/api/issue', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-latimere-admin-key': '<ADMIN_KEY>',
  },
  body: JSON.stringify({
    type: 'CertificationCredential',
    title: 'Safety Training (Signed Sample)',
    issuerName: 'Latimere',
    subjectName: 'Jordan Taylor',
    expiresAt: new Date(Date.now() + 1000*60*60*24*365).toISOString(),
    claims: { course: 'Safety 101', score: 'Passed', level: 'Gold' },
  }),
}).then(r => r.json())`

    const verify = `// Verify / get receipt
fetch('/api/receipt', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ token: '<JWT>', verifierName: 'MyVerifier' }),
}).then(r => r.json())`

    const revoke = `// Revoke (if implemented)
fetch('/api/revoke', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-latimere-admin-key': '<ADMIN_KEY>',
  },
  body: JSON.stringify({ credentialId: '<CREDENTIAL_ID>' }),
}).then(r => r.json())`

    const links = `// Holder links
// Verify link (share as QR): ${baseUrl}/verify#t=<JWT>
// Wallet inbox handoff: ${baseUrl}/wallet?inbox=<JWT>`

    return { issue, verify, revoke, links }
  }, [baseUrl])

  return (
    <>
      <Head>
        <title>Latimere • Sandbox</title>
        <meta name="description" content="Developer sandbox for issuing, verifying, and revoking credentials." />
      </Head>

      <div className="min-h-screen bg-gray-950 text-white">
        <TopNav />

        <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Developer Sandbox</h1>
              <p className="mt-2 text-sm text-gray-300">Quickly issue test credentials, verify them, and generate receipts.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/wallet" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                Open wallet →
              </Link>
              <Link href="/verify" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                Open verify →
              </Link>
              <Link href="/issuer" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                Issuer Lite →
              </Link>
            </div>
          </div>

          <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Issue */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-lg font-semibold">1) Issue test credentials</h2>
              <p className="mt-1 text-sm text-gray-300">Signed samples require your issuer admin key.</p>

              <label className="mt-4 block text-xs text-white/60">Issuer admin key</label>
              <input
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Admin key"
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
                  onClick={onIssueSigned}
                >
                  Issue signed sample
                </button>

                <button
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                  onClick={async () => {
                    try {
                      await copyText('unsigned sample json', unsignedSample)
                      setIssueMsg('Copied unsigned JSON.')
                      setTimeout(() => setIssueMsg(null), 1200)
                    } catch (e: any) {
                      setIssueErr(e?.message || 'Copy failed')
                    }
                  }}
                >
                  Copy unsigned sample JSON
                </button>
              </div>

              {(issueMsg || issueErr) && (
                <div
                  className={[
                    'mt-4 rounded-lg border px-3 py-2 text-sm',
                    issueErr ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
                  ].join(' ')}
                >
                  {issueErr || issueMsg}
                </div>
              )}

              {issuedJwt && (
                <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs text-white/60">Issued JWT</div>
                  <div className="mt-2 break-all font-mono text-[11px] text-white/80">{issuedJwt}</div>

                  <div className="mt-3 text-xs text-white/60">Credential ID</div>
                  <div className="mt-1 font-mono text-[11px] text-white/80">{issuedCredentialId || '—'}</div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                      onClick={async () => {
                        try {
                          await copyText('jwt', issuedJwt)
                          setIssueMsg('Copied JWT.')
                          setTimeout(() => setIssueMsg(null), 1200)
                        } catch (e: any) {
                          setIssueErr(e?.message || 'Copy failed')
                        }
                      }}
                    >
                      Copy JWT
                    </button>

                    <button
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                      onClick={onToggleQr}
                      title="QR to /verify link"
                    >
                      {qrOpen ? 'Hide verify QR' : 'Show verify QR'}
                    </button>

                    {verifyLink && (
                      <Link
                        href={verifyLink.replace(/^https?:\/\/[^/]+/, '')}
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                      >
                        Open verify →
                      </Link>
                    )}

                    {walletInboxLink && (
                      <Link
                        href={walletInboxLink.replace(/^https?:\/\/[^/]+/, '')}
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                        title="Add to wallet inbox via query param"
                      >
                        Send to inbox →
                      </Link>
                    )}
                  </div>

                  {qrOpen && (
                    <div className="mt-4">
                      {qrErr ? (
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{qrErr}</div>
                      ) : qrDataUrl ? (
                        <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={qrDataUrl} alt="Verify QR" className="h-56 w-56" />
                        </div>
                      ) : (
                        <div className="text-sm text-white/70">Generating…</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Verify */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-lg font-semibold">2) Verify tester</h2>
              <p className="mt-1 text-sm text-gray-300">Paste a token or any link/QR payload containing a JWT.</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-white/60">Verifier name</label>
                  <input
                    value={verifierName}
                    onChange={(e) => setVerifierName(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
                    placeholder="Sandbox"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-60"
                    onClick={onVerify}
                    disabled={verifying}
                  >
                    {verifying ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
              </div>

              <label className="mt-4 block text-xs text-white/60">Token or link</label>
              <textarea
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                className="mt-2 h-28 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs text-white outline-none"
                placeholder="JWT, /verify#t=..., /wallet#claim=..., https://..."
              />

              {verifyErr && (
                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {verifyErr}
                </div>
              )}

              {receipt && (
                <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-white/60">Verdict</div>
                      <div className="mt-1 text-sm font-semibold">{String(receipt.result?.verdict || 'unknown').toUpperCase()}</div>
                      <div className="mt-2 text-xs text-white/60">Receipt ID</div>
                      <div className="mt-1 font-mono text-[11px] text-white/80">{receipt.receiptId}</div>
                    </div>
                    <div className="text-right text-xs text-white/60">
                      <div>Signature: {receipt.result?.signatureValid ? 'Valid' : 'Invalid'}</div>
                      <div>Status: {receipt.result?.status || 'unknown'}</div>
                      <div>Expired: {receipt.result?.expired ? 'Yes' : 'No'}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/receipts/${encodeURIComponent(receipt.receiptId)}`}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                    >
                      Open receipt →
                    </Link>

                    <button
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                      onClick={onSaveReceiptToWallet}
                    >
                      Save receipt to wallet
                    </button>

                    <button
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                      onClick={async () => {
                        try {
                          const link = receipt.receiptUrl || `${baseUrl}/receipts/${encodeURIComponent(receipt.receiptId)}`
                          await copyText('receipt link', link)
                          setSavedToast('Copied receipt link')
                          setTimeout(() => setSavedToast(null), 1200)
                        } catch (e: any) {
                          setVerifyErr(e?.message || 'Copy failed')
                        }
                      }}
                    >
                      Copy receipt link
                    </button>
                  </div>

                  {savedToast && (
                    <div className="mt-3 inline-flex rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                      {savedToast}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Revoke + snippets */}
          <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-lg font-semibold">3) Revoke tester (optional)</h2>
              <p className="mt-1 text-sm text-gray-300">Calls <span className="font-mono">/api/revoke</span> if implemented.</p>

              <label className="mt-4 block text-xs text-white/60">Credential ID</label>
              <input
                value={revokeCredentialId}
                onChange={(e) => setRevokeCredentialId(e.target.value)}
                placeholder={issuedCredentialId ? `e.g. ${issuedCredentialId}` : 'credentialId'}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm hover:bg-red-500/20 disabled:opacity-60"
                  onClick={onRevoke}
                  disabled={revoking}
                >
                  {revoking ? 'Revoking…' : 'Revoke'}
                </button>
              </div>

              {(revokeMsg || revokeErr) && (
                <div
                  className={[
                    'mt-4 rounded-lg border px-3 py-2 text-sm',
                    revokeErr ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
                  ].join(' ')}
                >
                  {revokeErr || revokeMsg}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-lg font-semibold">4) Copy/paste snippets</h2>
              <p className="mt-1 text-sm text-gray-300">Use these to integrate quickly.</p>

              <div className="mt-4">
                <div className="text-xs text-white/60">Issue</div>
                {codeBlock(snippets.issue)}
                <button
                  className="mt-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                  onClick={() => copyText('issue snippet', snippets.issue)}
                >
                  Copy issue snippet
                </button>
              </div>

              <div className="mt-4">
                <div className="text-xs text-white/60">Verify / receipt</div>
                {codeBlock(snippets.verify)}
                <button
                  className="mt-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                  onClick={() => copyText('verify snippet', snippets.verify)}
                >
                  Copy verify snippet
                </button>
              </div>

              <div className="mt-4">
                <div className="text-xs text-white/60">Revoke (optional)</div>
                {codeBlock(snippets.revoke)}
                <button
                  className="mt-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                  onClick={() => copyText('revoke snippet', snippets.revoke)}
                >
                  Copy revoke snippet
                </button>
              </div>

              <div className="mt-4">
                <div className="text-xs text-white/60">Links</div>
                {codeBlock(snippets.links)}
              </div>
            </div>
          </section>

          <div className="mt-8 text-xs text-white/50">
            Tip: For the smoothest demo, issue → verify → save receipt → open wallet to see it in “Recent activity”.
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  )
}

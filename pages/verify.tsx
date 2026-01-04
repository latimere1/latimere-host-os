// pages/verify.tsx
import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toQrDataUrl } from '../lib/qr/toQrDataUrl'
import { logError, logInfo, logWarn } from '../lib/verify/log'
import { clearHash, extractJwtFromAnyInput, isProbablyJwt, readTokenFromHash, tokenFingerprint } from '../lib/verify/token'
import { requestReceipt, type Receipt } from '../lib/verify/receiptClient'
import ScanModal from '../components/verify/ScanModal'
import { upsertReceipt, type WalletReceipt } from '../lib/wallet/receiptStore'

type Props = {
  initialToken: string | null
  initialVerifierName: string
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const qToken = ctx.query.token
  const qName = ctx.query.verifierName
  const initialToken = typeof qToken === 'string' && qToken.trim() ? qToken.trim() : null
  const initialVerifierName = typeof qName === 'string' && qName.trim() ? qName.trim() : 'Verifier'
  return { props: { initialToken, initialVerifierName } }
}

function verdictLabel(v?: Receipt['result'] | null) {
  const vv = (v?.verdict || 'unknown').toLowerCase()
  if (vv === 'valid') return 'VALID'
  if (vv === 'revoked') return 'REVOKED'
  if (vv === 'expired') return 'EXPIRED'
  return 'UNKNOWN'
}

function verdictBadgeClass(v?: Receipt['result'] | null) {
  const vv = (v?.verdict || 'unknown').toLowerCase()
  if (vv === 'valid') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
  if (vv === 'revoked') return 'border-red-500/30 bg-red-500/10 text-red-200'
  if (vv === 'expired') return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200'
  return 'border-white/10 bg-white/5 text-white/70'
}

async function copyText(text: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) throw new Error('Clipboard not supported')
  await navigator.clipboard.writeText(text)
}

const VerifyPage: NextPage<Props> = ({ initialToken, initialVerifierName }) => {
  const [tokenLike, setTokenLike] = useState(initialToken ?? '')
  const [verifierName, setVerifierName] = useState(initialVerifierName)

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  const [scanOpen, setScanOpen] = useState(false)

  const [receiptCopied, setReceiptCopied] = useState(false)
  const [receiptQrOpen, setReceiptQrOpen] = useState(false)
  const [receiptQrDataUrl, setReceiptQrDataUrl] = useState('')
  const [receiptQrErr, setReceiptQrErr] = useState<string | null>(null)

  const [savedToast, setSavedToast] = useState<string | null>(null)

  const hasToken = useMemo(() => !!tokenLike.trim(), [tokenLike])

  const receiptUrl = useMemo(() => {
    if (!receipt?.receiptId) return ''
    if (receipt.receiptUrl) return receipt.receiptUrl
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/receipts/${receipt.receiptId}`
  }, [receipt?.receiptId, receipt?.receiptUrl])

  const runVerify = useCallback(
    async (input: string, name: string) => {
      const raw = (input || '').trim()
      const vn = (name || '').trim() || 'Verifier'

      const extracted = extractJwtFromAnyInput(raw)
      if (!extracted?.jwt) {
        setErr('Paste a JWT or a link/QR that contains a JWT.')
        logWarn('[verify] token extraction failed', { rawLen: raw.length })
        return
      }

      if (!isProbablyJwt(extracted.jwt)) {
        setErr('The extracted token does not look like a JWT.')
        logWarn('[verify] extracted not jwt', { via: extracted.via, len: extracted.jwt.length, fp: tokenFingerprint(extracted.jwt) })
        return
      }

      if (raw !== extracted.jwt) {
        setTokenLike(extracted.jwt)
        logInfo('[verify] normalized token input', { via: extracted.via, rawLen: raw.length, jwtLen: extracted.jwt.length })
      }

      setLoading(true)
      setErr(null)
      setReceipt(null)
      setReceiptCopied(false)
      setReceiptQrOpen(false)
      setReceiptQrDataUrl('')
      setReceiptQrErr(null)

      try {
        logInfo('[verify] requesting receipt', { verifierName: vn, via: extracted.via, tokenLen: extracted.jwt.length })
        const data = await requestReceipt({ token: extracted.jwt, verifierName: vn })
        logInfo('[verify] receipt ok', { receiptId: data?.receiptId, verdict: data?.result?.verdict })
        setReceipt(data)
      } catch (e: any) {
        logError('[verify] verify failed', { message: e?.message })
        setErr(e?.message || 'Verification failed')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Auto-verify once on initial load (hash beats query)
  useEffect(() => {
    const hashToken = readTokenFromHash()
    const queryToken = (initialToken || '').trim()
    const token = (hashToken || queryToken || '').trim()

    if (!token) {
      logInfo('[verify] no initial token')
      return
    }

    setTokenLike(token)
    logInfo('[verify] auto-verify', { source: hashToken ? 'hash' : 'query', tokenLen: token.length })
    runVerify(token, initialVerifierName)

    if (hashToken) clearHash()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onCopyReceiptLink = useCallback(async () => {
    if (!receiptUrl) return
    try {
      await copyText(receiptUrl)
      setReceiptCopied(true)
      setTimeout(() => setReceiptCopied(false), 1200)
    } catch (e: any) {
      setErr(e?.message || 'Failed to copy receipt link')
    }
  }, [receiptUrl])

  const onToggleReceiptQr = useCallback(async () => {
    const next = !receiptQrOpen
    setReceiptQrOpen(next)
    setReceiptQrErr(null)
    setReceiptQrDataUrl('')

    if (!next) return
    if (!receiptUrl) {
      setReceiptQrErr('No receipt link available.')
      return
    }

    try {
      const dataUrl = await toQrDataUrl(receiptUrl)
      setReceiptQrDataUrl(dataUrl)
    } catch (e: any) {
      setReceiptQrErr(e?.message || 'Failed to generate receipt QR')
    }
  }, [receiptQrOpen, receiptUrl])

  const onSaveReceipt = useCallback(() => {
    if (!receipt?.receiptId) return

    const wr: WalletReceipt = {
      receiptId: receipt.receiptId,
      createdAt: receipt.createdAt || new Date().toISOString(),
      receiptUrl: receiptUrl || receipt.receiptUrl,
      verifierName: receipt.verifier?.name || verifierName || 'Verifier',
      verdict: receipt.result?.verdict || 'unknown',
      status: receipt.result?.status || 'unknown',
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
    logInfo('[verify] saved receipt to wallet', { receiptId: wr.receiptId, verdict: wr.verdict, credentialId: wr.credentialId })
    setSavedToast('Saved to wallet')
    setTimeout(() => setSavedToast(null), 1200)
  }, [receipt, receiptUrl, verifierName])

  const verdictText = verdictLabel(receipt?.result)

  return (
    <>
      <Head>
        <title>Verify Credential</title>
      </Head>

      <main className="min-h-screen bg-[#050b14] text-white">
        <div className="mx-auto w-full max-w-3xl px-6 py-14">
          <h1 className="text-4xl font-semibold">Verify</h1>
          <p className="mt-2 text-white/70">
            Paste a verification link or token, or scan a QR code. We’ll check whether it’s authentic and current.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
            <label className="block text-sm text-white/70">Verifier name</label>
            <input
              value={verifierName}
              onChange={(e) => setVerifierName(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
              placeholder="Verifier"
            />

            <label className="mt-5 block text-sm text-white/70">Token or link</label>
            <textarea
              value={tokenLike}
              onChange={(e) => setTokenLike(e.target.value)}
              className="mt-2 h-28 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs text-white outline-none"
              placeholder="Paste JWT, verify link, or wallet claim link here…"
            />

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                disabled={!hasToken || loading}
                onClick={() => runVerify(tokenLike.trim(), verifierName.trim() || 'Verifier')}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
              >
                {loading ? 'Verifying…' : 'Verify'}
              </button>

              <button
                onClick={() => {
                  setTokenLike('')
                  setErr(null)
                  setReceipt(null)
                  setReceiptCopied(false)
                  setReceiptQrOpen(false)
                  setReceiptQrDataUrl('')
                  setReceiptQrErr(null)
                  logInfo('[verify] cleared')
                }}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm"
              >
                Clear
              </button>

              <button
                onClick={() => setScanOpen(true)}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Scan QR
              </button>

              {receipt?.receiptId && (
                <span
                  className={[
                    'ml-auto inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
                    verdictBadgeClass(receipt?.result),
                  ].join(' ')}
                  title="Verification verdict"
                >
                  {verdictText}
                </span>
              )}
            </div>
          </div>

          {err && <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">{err}</div>}

          {!err && receipt && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-white/70">Receipt</div>
                <div className="text-xs text-white/50">{receipt.createdAt}</div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {receiptUrl && (
                  <>
                    <Link
                      href={receiptUrl.replace(/^https?:\/\/[^/]+/, '')}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                    >
                      View receipt →
                    </Link>

                    <button
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                      onClick={onCopyReceiptLink}
                    >
                      {receiptCopied ? 'Copied!' : 'Copy receipt link'}
                    </button>

                    <button
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                      onClick={onToggleReceiptQr}
                    >
                      {receiptQrOpen ? 'Hide receipt QR' : 'Show receipt QR'}
                    </button>

                    <button
                      className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-black hover:opacity-90"
                      onClick={onSaveReceipt}
                      title="Save this verification receipt into your local wallet activity"
                    >
                      Save to wallet
                    </button>

                    <Link
                      href="/wallet"
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                    >
                      Open wallet →
                    </Link>
                  </>
                )}
              </div>

              {savedToast && (
                <div className="mt-3 inline-flex rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                  {savedToast}
                </div>
              )}

              {receiptQrOpen && (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-white/60">Receipt QR</div>
                  {receiptQrErr ? (
                    <div className="mt-2 text-sm text-red-200">{receiptQrErr}</div>
                  ) : receiptQrDataUrl ? (
                    <div className="mt-3 inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <img src={receiptQrDataUrl} alt="Receipt QR code" className="h-56 w-56" />
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-white/70">Generating…</div>
                  )}
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-white/60">Signature</div>
                  <div className="mt-1 text-sm">{receipt.result?.signatureValid ? 'Valid' : 'Invalid'}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-white/60">Status</div>
                  <div className="mt-1 text-sm">{receipt.result?.status ?? 'unknown'}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-white/60">Expired</div>
                  <div className="mt-1 text-sm">{receipt.result?.expired ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {receipt.result?.reason && (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/80">
                  <div className="text-xs text-white/60">Reason</div>
                  <div className="mt-1">{receipt.result.reason}</div>
                </div>
              )}

              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs text-white/60">Credential</div>
                <div className="mt-2 text-sm">
                  <div className="font-medium">{receipt.credential?.title}</div>
                  <div className="text-white/70">
                    {receipt.credential?.subjectName} • {receipt.credential?.issuerName}
                  </div>
                  <div className="mt-2 text-xs text-white/50">{receipt.credential?.credentialId}</div>
                </div>
              </div>

              <div className="mt-4 text-xs text-white/50">
                Tip: verify accepts JWTs, verify links (<span className="font-mono">/verify#t=...</span>) and wallet claim links (
                <span className="font-mono">/wallet#claim=...</span>).
              </div>
            </div>
          )}
        </div>

        <ScanModal
          open={scanOpen}
          onClose={() => setScanOpen(false)}
          onScanned={async (raw) => {
            setScanOpen(false)
            const extracted = extractJwtFromAnyInput(raw || '')
            if (!extracted?.jwt) {
              setErr('QR code scanned, but no JWT was found in it.')
              logWarn('[verify] scanned data did not contain jwt', { rawLen: (raw || '').length })
              return
            }
            setTokenLike(extracted.jwt)
            await runVerify(extracted.jwt, verifierName.trim() || 'Verifier')
          }}
        />
      </main>
    </>
  )
}

export default VerifyPage

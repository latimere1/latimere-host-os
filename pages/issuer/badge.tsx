// pages/issuer/badge.tsx
import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import QRCode from 'qrcode'
import TopNav from '../../components/TopNav'

function logInfo(msg: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') console.info(msg, data ?? '')
}
function logWarn(msg: string, data?: any) {
  console.warn(msg, data ?? '')
}
function logError(msg: string, data?: any) {
  console.error(msg, data ?? '')
}

type ReceiptLike = {
  credential?: {
    credentialId?: string | null
    title?: string | null
    issuerName?: string | null
    subjectName?: string | null
    exp?: number | null
  }
  result?: {
    verdict?: 'valid' | 'revoked' | 'expired' | 'unknown'
    status?: 'active' | 'revoked' | 'unknown'
    expired?: boolean
  }
}

function toAbs(urlOrPath: string) {
  const v = (urlOrPath || '').trim()
  if (!v) return ''
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  if (typeof window === 'undefined') return v
  return `${window.location.origin}${v.startsWith('/') ? v : `/${v}`}`
}

function formatExp(exp?: number | null) {
  if (!exp || !Number.isFinite(exp)) return '—'
  try {
    return new Date(exp * 1000).toLocaleDateString()
  } catch {
    return '—'
  }
}

/**
 * Badge page supports two modes:
 * 1) Preferred: /issuer/badge?token=<JWT>  (we DO NOT include the token in printed QR; it is only used to display details)
 * 2) Minimal:   /issuer/badge?verifyUrl=<absolute-or-relative-verify-url>&title=...&subject=...&issuer=...&exp=...
 *
 * The badge QR encodes the verify URL (recommended: /verify#t=<JWT>).
 * If token is provided, we will construct verifyUrl = /verify#t=<token> unless verifyUrl is provided explicitly.
 */
export default function IssuerBadgePage() {
  const router = useRouter()

  const [verifyUrl, setVerifyUrl] = React.useState<string>('')
  const [qrDataUrl, setQrDataUrl] = React.useState<string>('')
  const [error, setError] = React.useState<string | null>(null)
  const [details, setDetails] = React.useState<{
    title: string
    issuerName: string
    subjectName: string
    expLabel: string
    credentialId: string
  }>({
    title: 'Credential Badge',
    issuerName: 'Issuer',
    subjectName: 'Subject',
    expLabel: '—',
    credentialId: '—',
  })

  // Parse query params (client-side)
  React.useEffect(() => {
    if (!router.isReady) return

    try {
      const q = router.query

      const tokenParam = Array.isArray(q.token) ? q.token[0] : (q.token as string | undefined)
      const verifyUrlParam = Array.isArray(q.verifyUrl) ? q.verifyUrl[0] : (q.verifyUrl as string | undefined)

      const title = (Array.isArray(q.title) ? q.title[0] : (q.title as string | undefined)) || 'Credential Badge'
      const issuerName = (Array.isArray(q.issuerName) ? q.issuerName[0] : (q.issuerName as string | undefined)) || 'Issuer'
      const subjectName = (Array.isArray(q.subjectName) ? q.subjectName[0] : (q.subjectName as string | undefined)) || 'Subject'
      const credentialId = (Array.isArray(q.credentialId) ? q.credentialId[0] : (q.credentialId as string | undefined)) || '—'
      const exp = (Array.isArray(q.exp) ? q.exp[0] : (q.exp as string | undefined)) || ''
      const expEpoch = exp ? Number(exp) : NaN
      const expLabel = Number.isFinite(expEpoch) ? formatExp(expEpoch) : '—'

      // Build verify URL
      let v = (verifyUrlParam || '').trim()
      if (!v && tokenParam) {
        v = `/verify#t=${encodeURIComponent(tokenParam)}`
      }
      v = toAbs(v)

      setVerifyUrl(v)
      setDetails({
        title,
        issuerName,
        subjectName,
        expLabel,
        credentialId,
      })

      logInfo('[Badge] init', {
        hasToken: !!tokenParam,
        hasVerifyUrl: !!verifyUrlParam,
        verifyUrlLen: v.length,
      })

      if (!v) {
        setError('Missing verifyUrl (or token). Provide ?verifyUrl=... or ?token=...')
      } else {
        setError(null)
      }
    } catch (e: any) {
      logError('[Badge] parse failed', { message: e?.message })
      setError('Failed to parse badge parameters.')
    }
  }, [router.isReady, router.query])

  // Generate QR data URL
  React.useEffect(() => {
    ;(async () => {
      if (!verifyUrl) return
      try {
        const png = await QRCode.toDataURL(verifyUrl, {
          errorCorrectionLevel: 'M',
          margin: 1,
          scale: 8,
        })
        setQrDataUrl(png)
        logInfo('[Badge] QR generated', { verifyUrlLen: verifyUrl.length })
      } catch (e: any) {
        logError('[Badge] QR generation failed', { message: e?.message })
        setError('Failed to generate QR code.')
      }
    })()
  }, [verifyUrl])

  return (
    <div className="min-h-screen bg-[#070B12] text-white">
      <Head>
        <title>Latimere · Badge</title>
      </Head>

      <TopNav />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Badge</h1>
            <p className="mt-2 text-sm text-gray-300">
              Print this page or screenshot it. Verifiers can scan the QR code to validate the credential.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-cyan-400"
              onClick={() => {
                logInfo('[Badge] print')
                window.print()
              }}
            >
              Print
            </button>

            <Link
              href="/issuer"
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              ← Back to Issuer
            </Link>

            <Link
              href="/verify"
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Verify →
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs text-white/60">Credential</div>
              <div className="mt-2 text-2xl font-semibold">{details.title}</div>

              <div className="mt-4 grid gap-2 text-sm text-white/80">
                <div>
                  <span className="text-white/50">Subject:</span>{' '}
                  <span className="font-medium text-white">{details.subjectName}</span>
                </div>
                <div>
                  <span className="text-white/50">Issuer:</span>{' '}
                  <span className="font-medium text-white">{details.issuerName}</span>
                </div>
                <div>
                  <span className="text-white/50">Expires:</span>{' '}
                  <span className="font-medium text-white">{details.expLabel}</span>
                </div>
                <div className="pt-2">
                  <div className="text-white/50 text-xs">Credential ID</div>
                  <div className="mt-1 break-all rounded-lg border border-white/10 bg-black/20 p-2 font-mono text-xs text-white/80">
                    {details.credentialId}
                  </div>
                </div>
              </div>

              {verifyUrl && (
                <div className="mt-4">
                  <div className="text-white/50 text-xs">Verify URL</div>
                  <div className="mt-1 break-all rounded-lg border border-white/10 bg-black/20 p-2 font-mono text-[11px] text-white/70">
                    {verifyUrl}
                  </div>
                </div>
              )}

              <div className="mt-4 text-xs text-white/50">
                This badge is revocable. If revoked, the verifier will see a red/REVOKED result immediately.
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="text-xs text-white/60">Scan to verify</div>

              <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white p-4">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="Verify QR"
                    className="h-[280px] w-[280px]"
                    onLoad={() => logInfo('[Badge] qr image loaded')}
                  />
                ) : (
                  <div className="flex h-[280px] w-[280px] items-center justify-center text-sm text-black/60">
                    Generating…
                  </div>
                )}
              </div>

              <div className="mt-3 text-center text-xs text-white/50">
                Open <span className="font-mono">/verify</span> and select <span className="font-mono">Scan QR</span>.
              </div>
            </div>
          </div>
        </section>

        <style jsx global>{`
          @media print {
            header,
            nav,
            footer,
            button,
            a {
              display: none !important;
            }
            body {
              background: white !important;
            }
          }
        `}</style>
      </main>
    </div>
  )
}

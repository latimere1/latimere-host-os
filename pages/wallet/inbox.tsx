// pages/wallet/inbox.tsx
import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import TopNav from '../../components/TopNav'
import SiteFooter from '../../components/SiteFooter'
import { createWalletSession, WalletSession } from '../../lib/wallet/storage'
import { WalletCredential, WalletState } from '../../lib/wallet/types'
import { credentialFromJwt } from '../../lib/wallet/jwtClient'

const INBOX_KEY = 'latimere_wallet_inbox_v0'
const PENDING_CLAIM_KEY = 'latimere_wallet_pending_claim_v0'

type InboxItem = {
  id: string
  createdAt: string
  source?: 'paste' | 'scan' | 'link'
  jwt: string
  preview?: {
    credentialId?: string
    title?: string
    issuerName?: string
    subjectName?: string
    exp?: number | null
  }
}

function logInfo(msg: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') console.info(msg, data ?? '')
}
function logWarn(msg: string, data?: any) {
  console.warn(msg, data ?? '')
}

function uuid(): string {
  return (globalThis.crypto as any)?.randomUUID?.() || `in_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function isProbablyJwt(s: string) {
  const parts = (s || '').split('.')
  return parts.length === 3 && parts.every((p) => p.length > 0)
}

function extractJwtFromAnyInput(input: string): { jwt: string; via: string } | null {
  const s0 = (input ?? '').trim()
  if (!s0) return null
  const s = s0.replace(/\s+/g, '')

  if (isProbablyJwt(s) && !s.includes('claim=') && !s.includes('token=') && !s.includes('t=')) return { jwt: s, via: 'raw-jwt' }

  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s)
      const hash = (u.hash || '').replace(/^#/, '')
      if (hash) {
        const hp = new URLSearchParams(hash)
        const v = hp.get('claim') || hp.get('t') || hp.get('token')
        if (v && v.trim()) return { jwt: decodeURIComponent(v.trim()), via: 'url-hash' }
      }
      const q = u.searchParams.get('claim') || u.searchParams.get('t') || u.searchParams.get('token')
      if (q && q.trim()) return { jwt: decodeURIComponent(q.trim()), via: 'url-query' }
    } catch {}
  }

  const_unlock: {
    const frag = s.startsWith('#') ? s.slice(1) : s
    try {
      const fp = new URLSearchParams(frag)
      const v = fp.get('claim') || fp.get('t') || fp.get('token')
      if (v && v.trim()) return { jwt: decodeURIComponent(v.trim()), via: 'fragment' }
    } catch {}
  }

  for (const key of ['claim=', 'token=', 't=']) {
    const idx = s.indexOf(key)
    if (idx >= 0) {
      const cut = s.slice(idx + key.length).split('&')[0].trim()
      if (!cut) continue
      try {
        return { jwt: decodeURIComponent(cut), via: `contains-${key.replace('=', '')}` }
      } catch {
        return { jwt: cut, via: `contains-${key.replace('=', '')}` }
      }
    }
  }

  return null
}

function loadInbox(): InboxItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(INBOX_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as InboxItem[]) : []
  } catch {
    return []
  }
}

function saveInbox(items: InboxItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(INBOX_KEY, JSON.stringify(items.slice(0, 50)))
  } catch {}
}

function addInboxItem(item: InboxItem) {
  const cur = loadInbox()
  saveInbox([item, ...cur].slice(0, 50))
}

function removeInboxItem(id: string) {
  const cur = loadInbox()
  saveInbox(cur.filter((x) => x.id !== id))
}

function clearInbox() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(INBOX_KEY)
  } catch {}
}

function stashPendingClaim(claim: string) {
  try {
    sessionStorage.setItem(PENDING_CLAIM_KEY, claim)
  } catch {}
}

export default function WalletInboxPage() {
  const sessionRef = React.useRef<WalletSession | null>(null)

  const [loaded, setLoaded] = React.useState(false)
  const [locked, setLocked] = React.useState(false)
  const [wallet, setWallet] = React.useState<WalletState>({ version: 1, credentials: [] })

  const [items, setItems] = React.useState<InboxItem[]>([])
  const [input, setInput] = React.useState('')
  const [status, setStatus] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  function getSession() {
    return sessionRef.current
  }

  function refresh() {
    setItems(loadInbox())
  }

  React.useEffect(() => {
    ;(async () => {
      try {
        if (typeof window === 'undefined') return
        if (!sessionRef.current) sessionRef.current = createWalletSession()
        const sess = sessionRef.current
        const s = await sess.load()
        setWallet(s)
        setLocked(sess.locked)
        setLoaded(true)
        refresh()
        logInfo('[Inbox] loaded', { locked: sess.locked, creds: s.credentials.length, items: loadInbox().length })
      } catch (e: any) {
        setLoaded(true)
        setError('Failed to load inbox.')
      }
    })()
  }, [])

  function alreadyInWallet(credId: string) {
    return wallet.credentials.some((c) => c.id === credId)
  }

  function clearFlash() {
    setTimeout(() => setStatus(null), 1400)
  }

  async function onAddToInbox() {
    setError(null)
    setStatus(null)

    const raw = input.trim()
    if (!raw) return setError('Paste a JWT or link first.')

    const ex = extractJwtFromAnyInput(raw)
    if (!ex?.jwt || !isProbablyJwt(ex.jwt)) return setError('That does not look like a JWT or supported link.')

    let preview: InboxItem['preview'] = {}
    try {
      const cred = credentialFromJwt(ex.jwt) as any
      preview = {
        credentialId: cred?.id,
        title: cred?.title,
        issuerName: cred?.issuerName,
        subjectName: cred?.subjectName,
        exp: cred?.expiresAt ? Math.floor(new Date(cred.expiresAt).getTime() / 1000) : null,
      }
    } catch {
      // still allow inbox storage even if preview fails
    }

    const item: InboxItem = {
      id: uuid(),
      createdAt: new Date().toISOString(),
      source: ex.via.includes('url') ? 'link' : 'paste',
      jwt: ex.jwt,
      preview,
    }

    addInboxItem(item)
    refresh()
    setInput('')
    setStatus('Added to inbox.')
    clearFlash()

    logInfo('[Inbox] added', { via: ex.via, jwtLen: ex.jwt.length, hasPreview: !!preview?.credentialId })
  }

  async function onAccept(item: InboxItem) {
    setError(null)
    setStatus(null)

    const sess = getSession()
    if (!sess) return setError('Wallet session not available.')

    if (sess.locked) {
      stashPendingClaim(item.jwt)
      setError('Wallet is locked. Unlock in /wallet, then return—this credential will auto-import.')
      logWarn('[Inbox] accept blocked (locked) - stashed pending claim', { inboxId: item.id })
      return
    }

    let cred: WalletCredential | null = null
    try {
      cred = credentialFromJwt(item.jwt) as any
    } catch (e: any) {
      setError('Could not decode this credential.')
      return
    }

    if (!cred) return setError('Could not decode this credential.')

    if (alreadyInWallet(cred.id)) {
      removeInboxItem(item.id)
      refresh()
      setStatus('Already in wallet. Removed from inbox.')
      clearFlash()
      return
    }

    try {
      const next: WalletState = { ...wallet, credentials: [cred, ...wallet.credentials] }
      await sess.save(next)
      setWallet(next)

      removeInboxItem(item.id)
      refresh()

      setStatus('Accepted into wallet.')
      clearFlash()

      logInfo('[Inbox] accepted', { inboxId: item.id, credentialId: cred.id })
    } catch (e: any) {
      setError(e?.message || 'Failed to save to wallet.')
    }
  }

  function onReject(id: string) {
    removeInboxItem(id)
    refresh()
    setStatus('Removed from inbox.')
    clearFlash()
  }

  function onClearInbox() {
    clearInbox()
    refresh()
    setStatus('Inbox cleared.')
    clearFlash()
  }

  return (
    <>
      <Head>
        <title>Latimere • Wallet Inbox</title>
        <meta name="description" content="Credential inbox for the Latimere wallet." />
      </Head>

      <div className="min-h-screen bg-gray-950 text-white">
        <TopNav />

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Credential inbox</h1>
              <p className="mt-2 max-w-prose text-sm text-gray-300">
                Paste a claim link or JWT here, then Accept it into your wallet. This is local to this browser.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Tip: If your wallet is locked, we’ll queue the credential and auto-import after unlock.
              </p>
            </div>

            <div className="flex gap-2">
              <Link href="/wallet" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                ← Back to wallet
              </Link>
              <button
                className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm hover:bg-red-500/20"
                onClick={onClearInbox}
              >
                Clear inbox
              </button>
            </div>
          </div>

          {(status || error) && (
            <div
              className={[
                'mt-6 rounded-lg border px-3 py-2 text-sm',
                error ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
              ].join(' ')}
              role={error ? 'alert' : 'status'}
            >
              {error || status}
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-sm font-semibold">Add to inbox</div>
            <textarea
              className="mt-3 h-36 w-full rounded-xl border border-white/15 bg-gray-900 p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              placeholder="Paste JWT, /wallet#claim=..., or /verify#t=... here…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400"
                onClick={onAddToInbox}
              >
                Add
              </button>
              <button
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10"
                onClick={() => {
                  setInput('')
                  setError(null)
                  setStatus(null)
                }}
              >
                Clear
              </button>

              <span className="ml-auto text-xs text-gray-400">
                Wallet: {loaded ? (locked ? 'Locked' : 'Unlocked') : 'Loading…'} • Inbox items: {items.length}
              </span>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold">Inbox</h2>

            {!loaded ? (
              <div className="mt-4 text-sm text-gray-400">Loading…</div>
            ) : items.length === 0 ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-gray-950/40 p-4 text-sm text-gray-300">
                Inbox is empty.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {items.map((it) => {
                  const title = it.preview?.title || 'Credential'
                  const issuer = it.preview?.issuerName || '—'
                  const subject = it.preview?.subjectName || '—'
                  const cid = it.preview?.credentialId || '(unknown id)'
                  const inWallet = it.preview?.credentialId ? alreadyInWallet(it.preview.credentialId) : false

                  return (
                    <div key={it.id} className="rounded-xl border border-white/10 bg-gray-950/40 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">{title}</div>
                          <div className="mt-1 text-xs text-gray-400">
                            {new Date(it.createdAt).toLocaleString()} • Source: {it.source || 'paste'}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            Issuer: <span className="text-gray-200">{issuer}</span> • Subject:{' '}
                            <span className="text-gray-200">{subject}</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Credential ID: <span className="font-mono">{cid}</span>
                          </div>
                          <div className="mt-2 text-[11px] text-gray-500">
                            Token preview: <span className="font-mono">{it.jwt.slice(0, 16)}…{it.jwt.slice(-16)}</span>
                          </div>
                          {inWallet && (
                            <div className="mt-2 text-xs text-yellow-200">Already in wallet.</div>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-cyan-400 disabled:opacity-60"
                            onClick={() => onAccept(it)}
                            disabled={inWallet}
                            title={locked ? 'Will queue until unlock' : 'Accept into wallet'}
                          >
                            Accept
                          </button>
                          <button
                            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs hover:bg-red-500/20"
                            onClick={() => onReject(it.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  )
}

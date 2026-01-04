// lib/wallet/storage.ts
import { WalletState, nowIso } from './types'

const NS = 'latimere_wallet_v0'
const KEY_PLAIN = `${NS}:plain`
const KEY_META = `${NS}:meta`
const KEY_CIPH = `${NS}:cipher`
const SESSION_CACHE_KEY = `${NS}:session_plain`

type Meta = {
  version: number
  locked: boolean
  saltB64?: string
  iterations?: number
  lastUnlockedAt?: string
}

const DEFAULT_STATE: WalletState = { version: 1, credentials: [] }

function logInfo(msg: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') console.info(msg, data ?? '')
}
function logWarn(msg: string, data?: any) {
  console.warn(msg, data ?? '')
}
function logError(msg: string, data?: any) {
  console.error(msg, data ?? '')
}

function safeLsGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch (e: any) {
    logWarn('[WalletStorage] localStorage.getItem failed', { key, message: e?.message })
    return null
  }
}
function safeLsSet(key: string, val: string) {
  try {
    localStorage.setItem(key, val)
  } catch (e: any) {
    logWarn('[WalletStorage] localStorage.setItem failed', { key, len: val?.length, message: e?.message })
    throw e
  }
}
function safeLsRemove(key: string) {
  try {
    localStorage.removeItem(key)
  } catch (e: any) {
    logWarn('[WalletStorage] localStorage.removeItem failed', { key, message: e?.message })
  }
}
function safeSsGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch (e: any) {
    logWarn('[WalletStorage] sessionStorage.getItem failed', { key, message: e?.message })
    return null
  }
}
function safeSsSet(key: string, val: string) {
  try {
    sessionStorage.setItem(key, val)
  } catch (e: any) {
    logWarn('[WalletStorage] sessionStorage.setItem failed', { key, len: val?.length, message: e?.message })
    throw e
  }
}
function safeSsRemove(key: string) {
  try {
    sessionStorage.removeItem(key)
  } catch (e: any) {
    logWarn('[WalletStorage] sessionStorage.removeItem failed', { key, message: e?.message })
  }
}

function validateState(parsed: any): WalletState {
  if (!parsed || typeof parsed !== 'object') return DEFAULT_STATE
  return {
    version: typeof parsed.version === 'number' ? parsed.version : 1,
    credentials: Array.isArray(parsed.credentials) ? parsed.credentials : [],
  }
}

function defaultMeta(): Meta {
  return { version: 1, locked: false }
}

function resetCorrupt(reason: string, extra?: any) {
  logWarn('[WalletStorage] resetting corrupted wallet storage', { reason, ...extra })
  safeLsRemove(KEY_PLAIN)
  safeLsRemove(KEY_META)
  safeLsRemove(KEY_CIPH)
  safeSsRemove(SESSION_CACHE_KEY)
}

function getMeta(): Meta {
  const raw = safeLsGet(KEY_META)
  if (!raw) return defaultMeta()

  try {
    const m = JSON.parse(raw) as Meta
    if (!m || typeof m !== 'object') return defaultMeta()
    if (typeof m.locked !== 'boolean') return defaultMeta()
    if (typeof m.version !== 'number') m.version = 1
    return m
  } catch (e: any) {
    resetCorrupt('meta-json-parse-failed', { message: e?.message })
    return defaultMeta()
  }
}

function setMeta(meta: Meta) {
  safeLsSet(KEY_META, JSON.stringify(meta))
}

function getPlain(): WalletState {
  const raw = safeLsGet(KEY_PLAIN)
  if (!raw) return DEFAULT_STATE
  try {
    return validateState(JSON.parse(raw))
  } catch (e: any) {
    resetCorrupt('plain-json-parse-failed', { message: e?.message })
    return DEFAULT_STATE
  }
}

function setPlain(state: WalletState) {
  safeLsSet(KEY_PLAIN, JSON.stringify(state))
}

function toB64(bytes: Uint8Array) {
  let s = ''
  bytes.forEach((b) => (s += String.fromCharCode(b)))
  return btoa(s)
}
function fromB64(b64: string) {
  const raw = atob(b64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

function hasWebCrypto() {
  return typeof window !== 'undefined' && !!window.crypto?.subtle
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number) {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function encryptJson(passphrase: string, obj: unknown, salt: Uint8Array, iterations: number) {
  const key = await deriveKey(passphrase, salt, iterations)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(obj))
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const cipher = new Uint8Array(cipherBuf)
  return { ivB64: toB64(iv), cipherB64: toB64(cipher) }
}

async function decryptJson<T>(
  passphrase: string,
  payload: { ivB64: string; cipherB64: string },
  salt: Uint8Array,
  iterations: number
): Promise<T> {
  const key = await deriveKey(passphrase, salt, iterations)
  const iv = fromB64(payload.ivB64)
  const cipher = fromB64(payload.cipherB64)
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
  const plain = new TextDecoder().decode(new Uint8Array(plainBuf))
  return JSON.parse(plain) as T
}

function safeReadCipher(): { ivB64: string; cipherB64: string } | null {
  const raw = safeLsGet(KEY_CIPH)
  if (!raw) return null
  try {
    const p = JSON.parse(raw) as any
    if (!p || typeof p !== 'object') return null
    if (typeof p.ivB64 !== 'string' || typeof p.cipherB64 !== 'string') return null
    return { ivB64: p.ivB64, cipherB64: p.cipherB64 }
  } catch {
    return null
  }
}

export type WalletSession = {
  locked: boolean
  load(): Promise<WalletState>
  save(state: WalletState): Promise<void>
  enableLock(passphrase: string): Promise<void>
  disableLock(passphrase: string): Promise<void>
  unlock(passphrase: string): Promise<void>
  lock(): Promise<void>
  clearAll(): Promise<void>
}

export function createWalletSession(): WalletSession {
  const api: WalletSession = {
    locked: false,

    async load() {
      const meta = getMeta()
      api.locked = meta.locked

      if (!meta.locked) {
        const s = getPlain()
        logInfo('[WalletStorage] load plain', { creds: s.credentials.length })
        return s
      }

      const cached = safeSsGet(SESSION_CACHE_KEY)
      if (cached) {
        try {
          const s = validateState(JSON.parse(cached))
          logInfo('[WalletStorage] load from session cache', { creds: s.credentials.length })
          return s
        } catch (e: any) {
          resetCorrupt('session-cache-json-parse-failed', { message: e?.message })
          api.locked = false
          return DEFAULT_STATE
        }
      }

      const cipher = safeReadCipher()
      if (!cipher || !meta.saltB64 || !meta.iterations) {
        resetCorrupt('locked-but-missing-cipher-or-meta', {
          hasCipher: !!cipher,
          hasSalt: !!meta.saltB64,
          hasIterations: !!meta.iterations,
        })
        api.locked = false
        return DEFAULT_STATE
      }

      logInfo('[WalletStorage] locked; returning empty until unlock')
      return DEFAULT_STATE
    },

    async save(state: WalletState) {
      const meta = getMeta()
      api.locked = meta.locked

      if (!meta.locked) {
        setPlain(state)
        logInfo('[WalletStorage] saved plain', { creds: state.credentials.length })
        return
      }

      const cached = safeSsGet(SESSION_CACHE_KEY)
      if (!cached) {
        logWarn('[WalletStorage] save blocked (locked & not unlocked in session)')
        throw new Error('Wallet is locked. Unlock to save.')
      }

      safeSsSet(SESSION_CACHE_KEY, JSON.stringify(state))
      logInfo('[WalletStorage] saved to session cache (locked mode v0)', { creds: state.credentials.length })
    },

    async enableLock(passphrase: string) {
      if (!hasWebCrypto()) throw new Error('Locking is not supported in this browser.')

      const meta = getMeta()
      if (meta.locked) resetCorrupt('enableLock-while-locked')

      const state = getPlain()
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iterations = 150_000
      const encrypted = await encryptJson(passphrase, state, salt, iterations)

      safeLsSet(KEY_CIPH, JSON.stringify(encrypted))
      safeLsRemove(KEY_PLAIN)

      setMeta({
        version: 1,
        locked: true,
        saltB64: toB64(salt),
        iterations,
        lastUnlockedAt: nowIso(),
      })

      safeSsSet(SESSION_CACHE_KEY, JSON.stringify(state))
      api.locked = true
      logInfo('[WalletStorage] lock enabled', { creds: state.credentials.length, iterations })
    },

    async disableLock(passphrase: string) {
      const meta = getMeta()
      api.locked = meta.locked
      if (!meta.locked) return

      if (!hasWebCrypto()) throw new Error('Unlocking is not supported in this browser.')
      if (!meta.saltB64 || !meta.iterations) {
        resetCorrupt('disableLock-meta-missing-salt-iterations')
        throw new Error('Wallet metadata is corrupted.')
      }

      const payload = safeReadCipher()
      if (!payload) {
        resetCorrupt('disableLock-missing-cipher')
        throw new Error('Encrypted wallet not found.')
      }

      try {
        const salt = fromB64(meta.saltB64)
        const state = validateState(await decryptJson<WalletState>(passphrase, payload, salt, meta.iterations))
        setPlain(state)
        safeLsRemove(KEY_CIPH)
        setMeta({ version: 1, locked: false })
        safeSsRemove(SESSION_CACHE_KEY)
        api.locked = false
        logInfo('[WalletStorage] lock disabled', { creds: state.credentials.length })
      } catch (e: any) {
        logWarn('[WalletStorage] disableLock decrypt failed', { message: e?.message, name: e?.name })
        throw new Error('Incorrect passcode or corrupted wallet.')
      }
    },

    async unlock(passphrase: string) {
      const meta = getMeta()
      api.locked = meta.locked
      if (!meta.locked) return

      if (!hasWebCrypto()) throw new Error('Unlocking is not supported in this browser.')
      if (!meta.saltB64 || !meta.iterations) {
        resetCorrupt('unlock-meta-missing-salt-iterations')
        throw new Error('Wallet metadata is corrupted.')
      }

      const payload = safeReadCipher()
      if (!payload) {
        resetCorrupt('unlock-missing-cipher')
        throw new Error('Encrypted wallet not found.')
      }

      try {
        const salt = fromB64(meta.saltB64)
        const state = validateState(await decryptJson<WalletState>(passphrase, payload, salt, meta.iterations))
        safeSsSet(SESSION_CACHE_KEY, JSON.stringify(state))
        setMeta({ ...meta, lastUnlockedAt: nowIso() })
        api.locked = true
        logInfo('[WalletStorage] unlocked (session)', { creds: state.credentials.length })
      } catch (e: any) {
        logWarn('[WalletStorage] unlock decrypt failed', { message: e?.message, name: e?.name })
        throw new Error('Incorrect passcode or corrupted wallet.')
      }
    },

    async lock() {
      safeSsRemove(SESSION_CACHE_KEY)
      const meta = getMeta()
      api.locked = meta.locked
      if (meta.locked) logInfo('[WalletStorage] locked (session cleared)')
    },

    async clearAll() {
      safeLsRemove(KEY_PLAIN)
      safeLsRemove(KEY_META)
      safeLsRemove(KEY_CIPH)
      safeSsRemove(SESSION_CACHE_KEY)
      api.locked = false
      logWarn('[WalletStorage] cleared all wallet data')
    },
  }

  return api
}

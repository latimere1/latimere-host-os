// lib/wallet/receiptStore.ts
export type WalletReceipt = {
  receiptId: string
  createdAt: string
  receiptUrl?: string

  verifierName: string
  verdict: 'valid' | 'revoked' | 'expired' | 'unknown'
  status: 'active' | 'revoked' | 'unknown'
  signatureValid: boolean
  expired: boolean

  credentialId?: string
  title?: string | null
  issuerName?: string | null
  subjectName?: string | null

  tokenHash?: string | null
  requestId?: string | null
}

const KEY = 'latimere_wallet_receipts_v0'
const MAX = 250

function safeParse<T>(s: string | null): T | null {
  if (!s) return null
  try {
    return JSON.parse(s) as T
  } catch {
    return null
  }
}

export function listReceipts(): WalletReceipt[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(KEY)
  const arr = safeParse<any[]>(raw)
  if (!Array.isArray(arr)) return []
  return arr.filter(Boolean) as WalletReceipt[]
}

export function upsertReceipt(r: WalletReceipt) {
  if (typeof window === 'undefined') return
  const all = listReceipts()
  const idx = all.findIndex((x) => x.receiptId === r.receiptId)

  if (idx >= 0) all[idx] = { ...all[idx], ...r }
  else all.unshift(r)

  // newest first + cap size
  all.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  const trimmed = all.slice(0, MAX)
  window.localStorage.setItem(KEY, JSON.stringify(trimmed))
}

export function deleteReceipt(receiptId: string) {
  if (typeof window === 'undefined') return
  const all = listReceipts().filter((x) => x.receiptId !== receiptId)
  window.localStorage.setItem(KEY, JSON.stringify(all))
}

export function clearReceipts() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(KEY)
}

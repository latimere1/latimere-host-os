// lib/wallet/statusCache.ts
export type CredentialStatusRecord = {
  credentialId: string
  checkedAt: string // ISO
  verifierName?: string
  verdict?: 'valid' | 'revoked' | 'expired' | 'unknown'
  status?: 'active' | 'revoked' | 'unknown'
  expired?: boolean
  signatureValid?: boolean
  reason?: string | null
}

export type StatusMap = Record<string, CredentialStatusRecord>

const STATUS_NS = 'latimere_wallet_status_v0'
const STATUS_KEY = `${STATUS_NS}:byCredentialId`

export function loadStatusMap(): StatusMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STATUS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as StatusMap) : {}
  } catch {
    return {}
  }
}

export function saveStatusMap(map: StatusMap) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STATUS_KEY, JSON.stringify(map))
  } catch {}
}

export function upsertStatus(map: StatusMap, rec: CredentialStatusRecord): StatusMap {
  return { ...map, [rec.credentialId]: rec }
}

export function clearStatusMap() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STATUS_KEY)
  } catch {}
}

// lib/wallet/types.ts
export type WalletCredentialType =
  | 'EmploymentCredential'
  | 'CertificationCredential'
  | 'LicenseCredential'
  | 'AccessBadgeCredential'
  | 'VendorComplianceCredential'
  | 'GenericCredential'

export type WalletCredentialFormat = 'unsigned' | 'jws'

export type WalletCredential = {
  id: string
  type: WalletCredentialType
  title: string
  issuerName: string
  issuerId?: string
  subjectName?: string
  subjectId?: string
  issuedAt: string // ISO
  expiresAt?: string // ISO
  claims: Record<string, unknown>
  createdAt: string // ISO
  updatedAt: string // ISO

  // v1 additions
  format?: WalletCredentialFormat
  jws?: string // signed JWT token (when format='jws')
}

export type WalletState = {
  version: number
  credentials: WalletCredential[]
}

export function nowIso() {
  return new Date().toISOString()
}

export function randomId(prefix = 'cred') {
  const r = Math.random().toString(16).slice(2)
  const t = Date.now().toString(16)
  return `${prefix}_${t}_${r}`
}

export function normalizeCredential(input: Partial<WalletCredential>): WalletCredential {
  const ts = nowIso()
  const id = input.id || randomId('cred')

  const issuedAt =
    typeof input.issuedAt === 'string' && input.issuedAt.length ? input.issuedAt : ts

  const createdAt =
    typeof input.createdAt === 'string' && input.createdAt.length ? input.createdAt : ts

  return {
    id,
    type: (input.type as WalletCredentialType) || 'GenericCredential',
    title: input.title || 'Untitled Credential',
    issuerName: input.issuerName || 'Unknown Issuer',
    issuerId: input.issuerId,
    subjectName: input.subjectName,
    subjectId: input.subjectId,
    issuedAt,
    expiresAt: input.expiresAt,
    claims: input.claims && typeof input.claims === 'object' ? input.claims : {},
    createdAt,
    updatedAt: ts,
    format: input.format || (input.jws ? 'jws' : 'unsigned'),
    jws: input.jws,
  }
}

export function isExpired(cred: WalletCredential, at: Date = new Date()) {
  if (!cred.expiresAt) return false
  const exp = new Date(cred.expiresAt)
  return Number.isFinite(exp.getTime()) && exp.getTime() < at.getTime()
}

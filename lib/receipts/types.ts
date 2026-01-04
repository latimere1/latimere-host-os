// lib/receipts/types.ts
export type ReceiptVerdict = 'valid' | 'revoked' | 'expired' | 'unknown'
export type ReceiptStatus = 'active' | 'revoked' | 'unknown'

export type Receipt = {
  receiptId: string
  createdAt: string
  receiptUrl?: string
  verifier?: { name?: string }
  result?: {
    signatureValid: boolean
    status: ReceiptStatus
    expired: boolean
    verdict: ReceiptVerdict
    reason?: string | null
  }
  credential?: {
    credentialId: string
    orgId?: string | null
    schemaId?: string | null
    schemaVersion?: number | null
    title?: string | null
    issuerName?: string | null
    subjectName?: string | null
    claims?: Record<string, any>
    exp?: number | null
  }
  tokenHash?: string
  requestId?: string
  ttl?: number // optional for Dynamo TTL
}

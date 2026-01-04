// lib/verify/receiptClient.ts
import { logWarn } from './log'

export type Receipt = {
  receiptId: string
  createdAt: string
  receiptUrl?: string
  verifier?: { name?: string }
  result?: {
    signatureValid: boolean
    status: 'active' | 'revoked' | 'unknown'
    expired: boolean
    verdict: 'valid' | 'revoked' | 'expired' | 'unknown'
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
}

export async function requestReceipt(args: { token: string; verifierName: string }): Promise<Receipt> {
  const res = await fetch('/api/receipt', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(args),
  })

  const text = await res.text()
  const data = (() => {
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  })()

  if (!res.ok) {
    logWarn('[verify] receipt failed', { status: res.status, data })
    throw new Error(data?.error || 'Verification failed')
  }

  return data as Receipt
}

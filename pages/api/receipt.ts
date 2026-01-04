// pages/api/receipt.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'node:crypto'
import { jwtVerify } from 'jose'
import { getPublicVerifyKey, issuerAudience, issuerIssuer } from '../../lib/keys'
import { getStatusStore } from '../../lib/statusStore'
import { writeAudit } from '../../lib/server/auditStore'
import { getReceiptStore, attachReceiptTtl } from '../../lib/receipts/store'
import type { Receipt, ReceiptStatus, ReceiptVerdict } from '../../lib/receipts/types'

function logInfo(msg: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') console.info(msg, data ?? '')
}
function logWarn(msg: string, data?: any) {
  console.warn(msg, data ?? '')
}
function logError(msg: string, data?: any) {
  console.error(msg, data ?? '')
}

function json(res: NextApiResponse, status: number, body: any) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function requestId(req: NextApiRequest) {
  return (req.headers['x-request-id'] || '').toString().trim() || crypto.randomUUID()
}

function safeStr(v: any, fallback = '') {
  const s = (v ?? '').toString().trim()
  return s ? s : fallback
}

function sha256Base64Url(input: string) {
  return crypto.createHash('sha256').update(input).digest('base64url')
}

function normalizeStatus(rec: any): { status: ReceiptStatus; reason?: string } {
  if (!rec) return { status: 'unknown' }
  const raw = (rec.status || rec.state || '').toString().toLowerCase()
  if (raw === 'revoked') return { status: 'revoked', reason: rec.reason || rec.revocationReason }
  if (raw === 'active') return { status: 'active' }
  if (rec.revokedAt || rec.revoked === true) return { status: 'revoked', reason: rec.reason || rec.revocationReason }
  if (rec.active === true) return { status: 'active' }
  return { status: 'unknown' }
}

function computeVerdict(expired: boolean, status: ReceiptStatus): ReceiptVerdict {
  if (expired) return 'expired'
  if (status === 'revoked') return 'revoked'
  if (status === 'active') return 'valid'
  return 'unknown'
}

function parseBody(req: NextApiRequest) {
  if (!req.body) return null
  if (typeof req.body === 'object') return req.body
  try {
    return JSON.parse(String(req.body))
  } catch {
    return null
  }
}

/**
 * Inputs:
 * - POST JSON: { token, verifierName }
 * - GET query: ?token=...&verifierName=...
 * - Authorization: Bearer <token> (any method)
 * Retrieval:
 * - GET query: ?receiptId=<id>  (no token needed)
 */
function getInputs(req: NextApiRequest): { token: string; verifierName: string; receiptId: string } {
  const bearer = safeStr(req.headers.authorization, '')
  const bearerToken = bearer.startsWith('Bearer ') ? bearer.slice('Bearer '.length).trim() : ''
  const receiptId = safeStr(req.query.receiptId, '')

  if (bearerToken) {
    const name = safeStr(parseBody(req)?.verifierName || req.query.verifierName, 'Unknown verifier')
    return { token: bearerToken, verifierName: name, receiptId }
  }

  if ((req.method || 'GET').toUpperCase() === 'POST') {
    const body = parseBody(req) || {}
    return {
      token: safeStr(body.token, ''),
      verifierName: safeStr(body.verifierName, 'Unknown verifier'),
      receiptId,
    }
  }

  return {
    token: safeStr(req.query.token, ''),
    verifierName: safeStr(req.query.verifierName, 'Unknown verifier'),
    receiptId,
  }
}

function getOrigin(req: NextApiRequest) {
  const proto = safeStr(req.headers['x-forwarded-proto'], 'http')
  const host = safeStr(req.headers.host, 'localhost:3000')
  return `${proto}://${host}`
}

async function writeVerifyAuditSafe(input: {
  orgId: string
  verifierName: string
  tokenHash: string
  credentialId: string
  verdict: ReceiptVerdict
  status: ReceiptStatus
  expired: boolean
  reason: string | null
  schemaId?: string | null
  schemaVersion?: number | null
  title?: string | null
  issuerName?: string | null
  subjectName?: string | null
  requestId: string
  receiptId: string
}) {
  try {
    await writeAudit({
      orgId: input.orgId,
      actorSub: `verifier:${input.verifierName || 'unknown'}`,
      actorEmail: undefined,
      action: 'VERIFY',
      credentialId: input.credentialId,
      schemaId: input.schemaId || undefined,
      detail: {
        requestId: input.requestId,
        receiptId: input.receiptId,
        verifierName: input.verifierName,
        tokenHash: input.tokenHash,
        verdict: input.verdict,
        status: input.status,
        expired: input.expired,
        reason: input.reason,
        credential: {
          credentialId: input.credentialId,
          schemaId: input.schemaId || null,
          schemaVersion: input.schemaVersion || null,
          title: input.title || null,
          issuerName: input.issuerName || null,
          subjectName: input.subjectName || null,
        },
      },
    })
    logInfo('[api/receipt] audit VERIFY written', { requestId: input.requestId, receiptId: input.receiptId, credentialId: input.credentialId })
  } catch (e: any) {
    logWarn('[api/receipt] audit VERIFY failed (non-fatal)', { requestId: input.requestId, receiptId: input.receiptId, message: e?.message })
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rid = requestId(req)
  const startedAt = Date.now()

  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return json(res, 405, { ok: false, error: 'Method not allowed', requestId: rid })
    }

    const { token, verifierName, receiptId } = getInputs(req)
    const store = getReceiptStore()

    // Retrieval: GET /api/receipt?receiptId=...
    if (req.method === 'GET' && receiptId && !token) {
      const found = await store.get(receiptId)
      if (!found) return json(res, 404, { ok: false, error: 'Receipt not found', requestId: rid })
      return json(res, 200, found)
    }

    if (!token) return json(res, 400, { ok: false, error: 'Missing token', requestId: rid })

    if (req.method === 'GET') {
      logWarn('[api/receipt] GET used (token may appear in URL logs). Prefer POST.', { requestId: rid })
    }

    // Verify signature
    let payload: any
    let protectedHeader: any
    try {
      const { key } = await getPublicVerifyKey()
      const out = await jwtVerify(token, key as any, { issuer: issuerIssuer(), audience: issuerAudience() })
      payload = out.payload
      protectedHeader = out.protectedHeader
    } catch (e: any) {
      logWarn('[api/receipt] jwtVerify failed', { requestId: rid, name: e?.name, message: e?.message })
      return json(res, 401, { ok: false, error: 'Invalid or untrusted token', requestId: rid })
    }

    const credentialId = payload?.cid || payload?.credentialId
    if (!credentialId || typeof credentialId !== 'string') {
      return json(res, 400, { ok: false, error: 'Token is missing credential id (cid)', requestId: rid })
    }

    const exp = typeof payload.exp === 'number' ? payload.exp : undefined
    const now = Math.floor(Date.now() / 1000)
    const expired = exp ? now >= exp : false

    // Revocation/status check
    const statusStore = getStatusStore()
    const statusRec = await statusStore.getStatus(credentialId)
    const { status, reason } = normalizeStatus(statusRec)
    const verdict = computeVerdict(expired, status)

    const receiptIdNew = crypto.randomUUID()
    const orgId = safeStr(payload?.orgId, 'org_default')
    const tokenHash = sha256Base64Url(token)

    const origin = getOrigin(req)
    const receiptUrl = `${origin}/receipts/${encodeURIComponent(receiptIdNew)}`

    const receipt: Receipt = attachReceiptTtl({
      receiptId: receiptIdNew,
      createdAt: new Date().toISOString(),
      receiptUrl,
      requestId: rid,
      verifier: { name: verifierName || 'Unknown verifier' },
      result: { signatureValid: true, status, expired, verdict, reason: reason || null },
      credential: {
        credentialId,
        orgId,
        schemaId: payload?.schemaId ?? null,
        schemaVersion: payload?.schemaVersion ?? null,
        title: payload?.title ?? null,
        issuerName: payload?.issuerName ?? null,
        subjectName: payload?.subjectName ?? null,
        claims: payload?.claims || {},
        exp: exp ?? null,
      },
      tokenHash,
    })

    // Persist receipt (durable if LATIMERE_RECEIPT_TABLE is set)
    try {
      await store.put(receipt)
    } catch (e: any) {
      // If store is down, still return the receipt (don’t break verification UX)
      logWarn('[api/receipt] store.put failed (non-fatal)', { requestId: rid, receiptId: receiptIdNew, message: e?.message })
    }

    await writeVerifyAuditSafe({
      orgId,
      verifierName: verifierName || 'Unknown verifier',
      tokenHash,
      credentialId,
      verdict,
      status,
      expired,
      reason: reason || null,
      schemaId: payload?.schemaId ?? null,
      schemaVersion: payload?.schemaVersion ?? null,
      title: payload?.title ?? null,
      issuerName: payload?.issuerName ?? null,
      subjectName: payload?.subjectName ?? null,
      requestId: rid,
      receiptId: receiptIdNew,
    })

    // Backwards-compatible: keep attachment header
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="verification-receipt-${credentialId}.json"`)

    logInfo('[api/receipt] ok', {
      requestId: rid,
      method: req.method,
      credentialId,
      verdict,
      status,
      expired,
      kid: protectedHeader?.kid,
      verifierName,
      receiptId: receiptIdNew,
      ms: Date.now() - startedAt,
    })

    res.status(200).send(JSON.stringify(receipt, null, 2))
  } catch (err: any) {
    logError('[api/receipt] error', { requestId: rid, message: err?.message, name: err?.name })
    return json(res, 500, { ok: false, error: 'Internal error', requestId: rid })
  }
}

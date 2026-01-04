// pages/api/status.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'node:crypto'
import { jwtVerify } from 'jose'
import { getPublicVerifyKey, issuerAudience, issuerIssuer } from '../../lib/keys'
import { getStatusStore } from '../../lib/statusStore'

type StatusOut = 'active' | 'revoked' | 'unknown'

function json(res: NextApiResponse, status: number, body: any) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function logInfo(msg: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') console.info(msg, data ?? '')
}
function logWarn(msg: string, data?: any) {
  console.warn(msg, data ?? '')
}
function logError(msg: string, data?: any) {
  console.error(msg, data ?? '')
}

function rid(req: NextApiRequest) {
  return (req.headers['x-request-id'] || '').toString().trim() || crypto.randomUUID()
}

function safeString(v: any): string {
  return (v ?? '').toString().trim()
}

/**
 * Supports:
 * - GET /api/status?credentialId=...
 * - GET /api/status?token=...  (verifies signature and extracts cid)
 * - Authorization: Bearer <token> (same as token param)
 *
 * IMPORTANT: This endpoint uses the StatusStore as the single source of truth for status.
 * We DO NOT scan the credentials table here (that was slow and inconsistent with revoke/store).
 */
function getTokenOrCredentialId(req: NextApiRequest): { token?: string; credentialId?: string } {
  const qToken = safeString(req.query.token)
  const qCid = safeString(req.query.credentialId)

  const bearer = safeString(req.headers.authorization)
  const bearerToken = bearer.startsWith('Bearer ') ? bearer.slice('Bearer '.length).trim() : ''

  const token = bearerToken || qToken
  const credentialId = qCid || undefined

  return { token: token || undefined, credentialId }
}

async function credentialIdFromToken(token: string): Promise<string> {
  const { key } = await getPublicVerifyKey()
  const verified = await jwtVerify(token, key as any, {
    issuer: issuerIssuer(),
    audience: issuerAudience(),
  })
  const p: any = verified.payload
  const cid = safeString(p.cid || p.credentialId)
  if (!cid) throw new Error('Token missing credentialId (cid)')
  return cid
}

async function readStatus(store: any, credentialId: string) {
  if (!store) return null
  // preferred shape in lib/statusStore.ts
  if (typeof store.getStatus === 'function') return await store.getStatus(credentialId)
  // fallback for other store implementations
  if (typeof store.get === 'function') return await store.get(credentialId)
  if (typeof store.lookup === 'function') return await store.lookup(credentialId)
  return null
}

function normalizeStatus(rec: any): { status: StatusOut; reason?: string | null; updatedAt?: string | null } {
  if (!rec) return { status: 'unknown', reason: null, updatedAt: null }

  const raw = safeString(rec.status || rec.state).toLowerCase()
  if (raw === 'revoked') return { status: 'revoked', reason: rec.reason || rec.revocationReason || null, updatedAt: rec.updatedAt || null }
  if (raw === 'active') return { status: 'active', reason: null, updatedAt: rec.updatedAt || null }

  // Heuristics for alt record shapes
  if (rec.revokedAt || rec.revoked === true) return { status: 'revoked', reason: rec.reason || rec.revocationReason || null, updatedAt: rec.updatedAt || null }
  if (rec.active === true) return { status: 'active', reason: null, updatedAt: rec.updatedAt || null }

  return { status: 'unknown', reason: null, updatedAt: rec.updatedAt || null }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = rid(req)
  const startedAt = Date.now()

  try {
    if (req.method !== 'GET') {
      return json(res, 405, { ok: false, error: 'Method not allowed', requestId })
    }

    const { token, credentialId: credentialIdParam } = getTokenOrCredentialId(req)

    if (!token && !credentialIdParam) {
      logWarn('[api/status] missing token/credentialId', { requestId })
      return json(res, 400, { ok: false, error: 'Missing token or credentialId', requestId })
    }

    let credentialId = credentialIdParam || ''

    if (token) {
      try {
        credentialId = await credentialIdFromToken(token)
        logInfo('[api/status] token verified', { requestId, credentialId, tokenLen: token.length })
      } catch (e: any) {
        // If token is present but invalid, return 400 (do not leak internals)
        logWarn('[api/status] token verify failed', { requestId, message: e?.message })
        return json(res, 400, { ok: false, error: 'Invalid token', requestId })
      }
    }

    if (!credentialId) {
      return json(res, 400, { ok: false, error: 'Missing credentialId', requestId })
    }

    const store = getStatusStore()
    const rec = await readStatus(store as any, credentialId)
    const out = normalizeStatus(rec)

    logInfo('[api/status] ok', {
      requestId,
      credentialId,
      status: out.status,
      hasReason: !!out.reason,
      ms: Date.now() - startedAt,
    })

    return json(res, 200, {
      ok: true,
      requestId,
      credentialId,
      status: out.status,
      reason: out.reason || null,
      updatedAt: out.updatedAt || null,
    })
  } catch (err: any) {
    logError('[api/status] error', { requestId, message: err?.message, stack: err?.stack })
    return json(res, 500, { ok: false, error: 'Internal error', requestId })
  }
}

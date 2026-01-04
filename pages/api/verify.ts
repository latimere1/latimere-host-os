// pages/api/verify.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { jwtVerify } from 'jose'
import { getPublicVerifyKey, issuerAudience, issuerIssuer } from '../../lib/keys'
import { getStatusStore } from '../../lib/statusStore'

function json(res: NextApiResponse, status: number, body: any) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function getToken(req: NextApiRequest): string {
  const q = req.query.token
  if (typeof q === 'string' && q.trim()) return q.trim()

  const bearer = (req.headers.authorization || '').toString()
  if (bearer.startsWith('Bearer ')) return bearer.slice('Bearer '.length).trim()

  return ''
}

async function readStatus(store: any, credentialId: string) {
  if (!store) return null
  if (typeof store.get === 'function') return await store.get(credentialId)
  if (typeof store.getStatus === 'function') return await store.getStatus(credentialId)
  if (typeof store.lookup === 'function') return await store.lookup(credentialId)
  return null
}

function normalizeStatus(rec: any): { status: 'active' | 'revoked' | 'unknown'; reason?: string } {
  if (!rec) return { status: 'unknown' }

  const raw = (rec.status || rec.state || '').toString().toLowerCase()
  if (raw === 'revoked') return { status: 'revoked', reason: rec.reason || rec.revocationReason }
  if (raw === 'active') return { status: 'active' }

  // Heuristics for different record shapes
  if (rec.revokedAt || rec.revoked === true) return { status: 'revoked', reason: rec.reason || rec.revocationReason }
  if (rec.active === true) return { status: 'active' }

  return { status: 'unknown' }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startedAt = Date.now()

  try {
    if (req.method !== 'GET') {
      json(res, 405, { ok: false, error: 'Method not allowed' })
      return
    }

    const token = getToken(req)
    if (!token) {
      json(res, 400, { ok: false, error: 'Missing token' })
      return
    }

    const { key } = await getPublicVerifyKey()

    const { payload, protectedHeader } = await jwtVerify(token, key as any, {
      issuer: issuerIssuer(),
      audience: issuerAudience(),
    })

    const credentialId = (payload as any).cid || (payload as any).credentialId
    if (!credentialId || typeof credentialId !== 'string') {
      json(res, 400, { ok: false, error: 'Token is missing credential id (cid)' })
      return
    }

    const exp = typeof payload.exp === 'number' ? payload.exp : undefined
    const now = Math.floor(Date.now() / 1000)
    const expired = exp ? now >= exp : false

    const store = getStatusStore()
    const statusRec = await readStatus(store as any, credentialId)
    const { status, reason } = normalizeStatus(statusRec)

    const verdict =
      expired ? 'expired' : status === 'revoked' ? 'revoked' : status === 'active' ? 'valid' : 'unknown'

    console.info('[api/verify] Verified', {
      credentialId,
      verdict,
      kid: (protectedHeader as any)?.kid,
      ms: Date.now() - startedAt,
    })

    json(res, 200, {
      ok: true,
      verdict, // valid | revoked | expired | unknown
      signatureValid: true,
      expired,
      status,
      reason: reason || null,
      exp: exp || null,
      credentialId,
      payload, // includes title/issuerName/subjectName/claims etc
    })
  } catch (err: any) {
    console.error('[api/verify] Error', { message: err?.message, stack: err?.stack })
    json(res, 500, { ok: false, error: 'Internal error' })
  }
}

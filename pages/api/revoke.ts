// pages/api/revoke.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'node:crypto'
import { getStatusStore } from '../../lib/statusStore'
import { requireIssuerAuth } from './_auth'
import { defaultOrgId } from '../../lib/server/ddb'
import { setCredentialRevoked } from '../../lib/server/credentialStore'
import { writeAudit } from '../../lib/server/auditStore'

type RevokeBody = {
  credentialId: string
  reason?: string
}

type RevokeOk = {
  ok: true
  requestId: string
  orgId: string
  credentialId: string
  status: 'revoked'
  reason: string
  updatedAt: string | null
  record: any
}

type RevokeErr = {
  ok: false
  requestId: string
  error: string
}

type RevokeResponse = RevokeOk | RevokeErr

function makeRequestId(req: NextApiRequest) {
  return (req.headers['x-request-id'] || '').toString().trim() || crypto.randomUUID()
}

function safeString(v: any) {
  return (v ?? '').toString().trim()
}

function parseBody(req: NextApiRequest): RevokeBody {
  if (!req.body) return {} as any
  if (typeof req.body === 'object') return req.body as RevokeBody
  try {
    return JSON.parse(String(req.body)) as RevokeBody
  } catch {
    return {} as any
  }
}

function normalizeUpdatedAt(rec: any): string | null {
  const v = rec?.updatedAt || rec?.revokedAt || rec?.ts || null
  return v ? String(v) : null
}

function clientIp(req: NextApiRequest) {
  const xf = safeString(req.headers['x-forwarded-for'])
  if (xf) return xf.split(',')[0].trim()
  return safeString((req.socket as any)?.remoteAddress) || ''
}

function isSafeCredentialId(id: string) {
  // keep permissive but avoid obvious garbage; don’t break existing IDs
  if (!id) return false
  if (id.length < 6 || id.length > 256) return false
  return /^[a-zA-Z0-9._:\-]+$/.test(id)
}

function sendJson(res: NextApiResponse, status: number, requestId: string, body: RevokeResponse) {
  res.status(status)
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Request-Id', requestId)
  res.end(JSON.stringify(body))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = makeRequestId(req)
  const startedAt = Date.now()

  const logCtx = {
    requestId,
    method: req.method,
    path: req.url,
    ip: clientIp(req),
  }

  try {
    if (req.method !== 'POST') {
      console.warn('[api/revoke] method not allowed', logCtx)
      return sendJson(res, 405, requestId, { ok: false, requestId, error: 'Method not allowed' })
    }

    // Auth: prefer Cognito bearer (requireIssuerAuth supports that), fallback admin header key (dev)
    const actor = await requireIssuerAuth(req)
    const orgId = actor.orgId || defaultOrgId()

    const body = parseBody(req)
    const credentialId = safeString(body?.credentialId)
    if (!credentialId) {
      console.warn('[api/revoke] missing credentialId', { ...logCtx, orgId, actorSub: actor?.sub })
      return sendJson(res, 400, requestId, { ok: false, requestId, error: 'Missing credentialId' })
    }
    if (!isSafeCredentialId(credentialId)) {
      console.warn('[api/revoke] invalid credentialId format', { ...logCtx, orgId, credentialId })
      return sendJson(res, 400, requestId, { ok: false, requestId, error: 'Invalid credentialId' })
    }

    const reason = safeString(body?.reason) || 'Revoked by issuer'

    // Single source of truth: StatusStore (idempotent if store supports it)
    const store: any = getStatusStore()

    // Optional pre-read to avoid noisy writes if already revoked (feature-detected)
    let existing: any = null
    if (typeof store.get === 'function') {
      try {
        existing = await store.get(credentialId)
      } catch (e: any) {
        console.warn('[api/revoke] store.get failed (non-fatal)', {
          ...logCtx,
          orgId,
          credentialId,
          message: e?.message,
        })
      }
    }

    if (existing?.status === 'revoked') {
      console.info('[api/revoke] already revoked (idempotent)', {
        ...logCtx,
        orgId,
        credentialId,
        actorSub: actor.sub,
        actorEmail: actor.email,
        ms: Date.now() - startedAt,
      })
      return sendJson(res, 200, requestId, {
        ok: true,
        requestId,
        orgId,
        credentialId,
        status: 'revoked',
        reason: safeString(existing?.reason) || reason,
        updatedAt: normalizeUpdatedAt(existing),
        record: existing,
      })
    }

    const rec = await store.setRevoked(credentialId, reason)

    // Back-compat: update credential metadata store (non-fatal)
    try {
      await setCredentialRevoked(orgId, credentialId)
    } catch (e: any) {
      console.warn('[api/revoke] setCredentialRevoked failed (non-fatal)', {
        ...logCtx,
        orgId,
        credentialId,
        message: e?.message,
      })
    }

    // Audit event (non-fatal)
    try {
      await writeAudit({
        orgId,
        actorSub: actor.sub,
        actorEmail: actor.email,
        action: 'REVOKE',
        credentialId,
        detail: { reason, requestId },
      })
    } catch (e: any) {
      console.warn('[api/revoke] writeAudit failed (non-fatal)', {
        ...logCtx,
        orgId,
        credentialId,
        message: e?.message,
      })
    }

    console.info('[api/revoke] revoked', {
      ...logCtx,
      orgId,
      credentialId,
      actorSub: actor.sub,
      actorEmail: actor.email,
      ms: Date.now() - startedAt,
    })

    return sendJson(res, 200, requestId, {
      ok: true,
      requestId,
      orgId,
      credentialId,
      status: 'revoked',
      reason,
      updatedAt: normalizeUpdatedAt(rec),
      record: rec,
    })
  } catch (err: any) {
    const statusCode = Number(err?.statusCode || 500)
    const msg = safeString(err?.message) || 'Internal error'

    console.error('[api/revoke] error', {
      ...logCtx,
      statusCode,
      message: msg,
      stack: err?.stack,
      ms: Date.now() - startedAt,
    })

    return sendJson(res, statusCode, requestId, {
      ok: false,
      requestId,
      error: statusCode === 500 ? 'Internal error' : msg,
    })
  }
}

// pages/api/audit.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'node:crypto'
import { requireIssuerAuth } from './issuer/_auth'
import { defaultOrgId } from '../../lib/server/ddb'
import { listAudit } from '../../lib/server/auditStore'

type AuditItem = any

function json(res: NextApiResponse, status: number, body: any) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function requestId(req: NextApiRequest) {
  return (req.headers['x-request-id'] || '').toString().trim() || crypto.randomUUID()
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

function safeString(v: any) {
  return (v ?? '').toString().trim()
}

function parseLimit(v: any, def = 50) {
  const n = Number(v)
  if (!Number.isFinite(n)) return def
  return Math.max(1, Math.min(500, Math.floor(n)))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rid = requestId(req)
  const startedAt = Date.now()

  try {
    if (req.method !== 'GET') {
      return json(res, 405, { ok: false, error: 'Method not allowed', requestId: rid })
    }

    const actor = await requireIssuerAuth(req)
    const orgId = actor.orgId || defaultOrgId()

    const limit = parseLimit(req.query.limit, 50)
    const action = safeString(req.query.action).toUpperCase() // optional filter
    const credentialId = safeString(req.query.credentialId) // optional filter (client-side filter if store doesn't support)

    logInfo('[api/audit] request', {
      requestId: rid,
      orgId,
      actorSub: actor.sub,
      hasAction: !!action,
      hasCredentialId: !!credentialId,
      limit,
    })

    // listAudit(orgId, limit) exists already in your repo (used by /api/issuer/audit earlier).
    const items = (await listAudit(orgId, limit)) as AuditItem[]

    // Light filtering in API v1 (fast, safe). Later we can add indexed queries.
    const filtered = items.filter((it: any) => {
      if (action && safeString(it?.action).toUpperCase() !== action) return false
      if (credentialId && safeString(it?.credentialId) !== credentialId) return false
      return true
    })

    logInfo('[api/audit] ok', {
      requestId: rid,
      orgId,
      returned: filtered.length,
      ms: Date.now() - startedAt,
    })

    return json(res, 200, {
      ok: true,
      requestId: rid,
      orgId,
      count: filtered.length,
      items: filtered,
    })
  } catch (err: any) {
    const status = Number(err?.statusCode || 500)
    const msg = safeString(err?.message) || 'Internal error'
    logError('[api/audit] error', { requestId: rid, status, message: msg, stack: err?.stack })
    return json(res, status, { ok: false, requestId: rid, error: status === 500 ? 'Internal error' : msg })
  }
}

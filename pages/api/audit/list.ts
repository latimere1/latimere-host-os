import type { NextApiRequest, NextApiResponse } from 'next'
import { requireIssuerAuth } from '../_auth'
import { defaultOrgId } from '../../../lib/server/ddb'
import { listAudit } from '../../../lib/server/auditStore'

function json(res: NextApiResponse, status: number, body: any) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' })

    const actor = await requireIssuerAuth(req)
    const orgId = actor.orgId || defaultOrgId()
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)))

    const items = await listAudit(orgId, limit)
    json(res, 200, { ok: true, orgId, items })
  } catch (err: any) {
    const status = err?.statusCode || 500
    json(res, status, { ok: false, error: err?.message || 'Internal error' })
  }
}

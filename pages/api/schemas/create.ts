import type { NextApiRequest, NextApiResponse } from 'next'
import { requireIssuerAuth } from '../_auth'
import { defaultOrgId } from '../../../lib/server/ddb'
import { putSchema } from '../../../lib/server/schemaStore'
import { writeAudit } from '../../../lib/server/auditStore'

type Body = {
  schemaId: string
  name: string
  description?: string
  version?: number
  jsonSchema: any
  uiSchema?: any
  active?: boolean
}

function json(res: NextApiResponse, status: number, body: any) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' })

    const actor = await requireIssuerAuth(req)
    const orgId = actor.orgId || defaultOrgId()
    const body = req.body as Body

    const missing: string[] = []
    if (!body?.schemaId) missing.push('schemaId')
    if (!body?.name) missing.push('name')
    if (!body?.jsonSchema) missing.push('jsonSchema')

    if (missing.length) return json(res, 400, { ok: false, error: `Missing: ${missing.join(', ')}` })

    const version = Number.isFinite(body.version) ? Number(body.version) : 1

    const rec = await putSchema({
      orgId,
      schemaId: body.schemaId,
      version,
      name: body.name,
      description: body.description,
      jsonSchema: body.jsonSchema,
      uiSchema: body.uiSchema,
      active: body.active ?? true,
      createdAt: new Date().toISOString(),
      createdBy: actor.sub,
    })

    await writeAudit({
      orgId,
      actorSub: actor.sub,
      actorEmail: actor.email,
      action: 'SCHEMA_CREATE',
      schemaId: body.schemaId,
      detail: { version, name: body.name },
    })

    json(res, 200, { ok: true, schema: rec })
  } catch (err: any) {
    const status = err?.statusCode || 500
    json(res, status, { ok: false, error: err?.message || 'Internal error' })
  }
}

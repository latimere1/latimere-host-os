// pages/api/issuer/seed-default-schemas.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { requireIssuerAuth } from '../_auth'
import { defaultOrgId } from '../../../lib/server/ddb'
import { listSchemas, putSchema } from '../../../lib/server/schemaStore'
import { writeAudit } from '../../../lib/server/auditStore'

function json(res: NextApiResponse, status: number, body: any) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function safeString(v: any) {
  return (v ?? '').toString().trim()
}

function nowIso() {
  return new Date().toISOString()
}

// Minimal JSON Schemas (draft-07-ish) for v1.
// Keep permissive at first; tighten later.
const DEFAULT_SCHEMAS: Array<{
  schemaId: string
  name: string
  description: string
  version: number
  jsonSchema: any
  uiSchema?: any
}> = [
  {
    schemaId: 'CertificationCredential',
    name: 'Certification Credential',
    description: 'Generic certification/training credential.',
    version: 1,
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'issuerName', 'subjectName', 'claims'],
      properties: {
        title: { type: 'string' },
        issuerName: { type: 'string' },
        subjectName: { type: 'string' },
        expiresAt: { type: 'string' },
        claims: { type: 'object', additionalProperties: true },
      },
    },
  },
  {
    schemaId: 'VendorCompliantBadge',
    name: 'Vendor Compliant Badge',
    description: 'A compliance badge for contractors/vendors (revocable).',
    version: 1,
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'issuerName', 'subjectName', 'claims'],
      properties: {
        title: { type: 'string' },
        issuerName: { type: 'string' },
        subjectName: { type: 'string' },
        expiresAt: { type: 'string' },
        claims: {
          type: 'object',
          additionalProperties: true,
          properties: {
            vendorCompany: { type: 'string' },
            insurance: { type: 'string' },
            safetyTraining: { type: 'string' },
            backgroundCheck: { type: 'string' },
          },
        },
      },
    },
  },
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' })

    const actor = await requireIssuerAuth(req)
    const orgId = actor.orgId || defaultOrgId()

    const existing = await listSchemas(orgId)
    const existingIds = new Set((existing || []).map((s: any) => safeString(s?.schemaId)))

    const created: string[] = []
    const skipped: string[] = []

    for (const s of DEFAULT_SCHEMAS) {
      if (existingIds.has(s.schemaId)) {
        skipped.push(s.schemaId)
        continue
      }

      await putSchema({
        orgId,
        schemaId: s.schemaId,
        version: s.version,
        name: s.name,
        description: s.description,
        jsonSchema: s.jsonSchema,
        uiSchema: s.uiSchema,
        active: true,
        createdAt: nowIso(),
        createdBy: actor.sub,
      })

      created.push(s.schemaId)
    }

    await writeAudit({
      orgId,
      actorSub: actor.sub,
      actorEmail: actor.email,
      action: 'SCHEMA_SEED',
      detail: { created, skipped },
    })

    return json(res, 200, { ok: true, orgId, created, skipped })
  } catch (err: any) {
    const status = err?.statusCode || 500
    return json(res, status, { ok: false, error: status === 500 ? 'Internal error' : err?.message })
  }
}

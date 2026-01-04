// pages/api/issue.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'node:crypto'
import { SignJWT } from 'jose'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { getPrivateSigningKey, issuerAudience, issuerIssuer, getIssuerAdminKey } from '../../lib/keys'
import { computeTtlFromExp, getStatusStore } from '../../lib/statusStore'

type IssueBody = {
  orgId?: string
  schemaId?: string

  // backwards-compat (older payloads)
  type?: string

  title: string
  issuerName: string
  subjectName: string
  expiresAt?: string
  claims?: Record<string, any>
}

type IssueResponse = {
  ok: boolean
  rid: string
  orgId?: string
  credentialId?: string
  jwt?: string
  exp?: number
  claimUrl?: string
  verifyUrl?: string
  error?: string
  stack?: string
  hint?: string
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

function json(res: NextApiResponse, status: number, body: IssueResponse) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function parseBody(req: NextApiRequest): any {
  if (!req.body) return null
  if (typeof req.body === 'object') return req.body
  try {
    return JSON.parse(String(req.body))
  } catch {
    return null
  }
}

function parseExpires(expiresAt?: string): number | undefined {
  if (!expiresAt) return undefined
  const ms = Date.parse(expiresAt)
  if (!Number.isFinite(ms)) return undefined
  return Math.floor(ms / 1000)
}

function isDebugErrorsEnabled() {
  return process.env.LATIMERE_DEBUG_ERRORS === '1' || process.env.NODE_ENV !== 'production'
}

function requireAdmin(req: NextApiRequest) {
  const expected = (() => {
    try {
      return getIssuerAdminKey()
    } catch {
      return ''
    }
  })()

  if (!expected) {
    console.warn('[api/issue] Missing LATIMERE_ISSUER_ADMIN_KEY (admin protection disabled)')
    return
  }

  const header = (req.headers['x-latimere-admin-key'] || '').toString()
  const bearer = (req.headers.authorization || '').toString()
  const token = bearer.startsWith('Bearer ') ? bearer.slice('Bearer '.length).trim() : ''
  const ok = header === expected || token === expected

  if (!ok) {
    console.warn('[api/issue] Unauthorized', {
      path: req.url,
      hasHeaderKey: !!header,
      hasBearer: !!token,
    })
    const err = new Error('Unauthorized')
    ;(err as any).statusCode = 401
    throw err
  }
}

function makeRid(req: NextApiRequest) {
  return req.headers['x-request-id']?.toString() || crypto.randomUUID()
}

function getOrgId(body: IssueBody): string {
  return body.orgId || process.env.LATIMERE_DEFAULT_ORG_ID || 'org_default'
}

function makeDdb() {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
  const client = new DynamoDBClient({ region })
  return DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  })
}

/**
 * Resolve latest ACTIVE schema version for a given org + schemaId.
 * This is a hard prerequisite for issuing. If missing/inactive, we return a 400 (not a 500).
 */
async function getLatestActiveSchema(ddb: DynamoDBDocumentClient, orgId: string, schemaId: string) {
  const schemasTable = requireEnv('LATIMERE_SCHEMAS_TABLE')
  const pk = `ORG#${orgId}`
  const skPrefix = `SCHEMA#${schemaId}#V#`

  const out = await ddb.send(
    new QueryCommand({
      TableName: schemasTable,
      KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
      ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' },
      ExpressionAttributeValues: { ':pk': pk, ':sk': skPrefix },
      ScanIndexForward: false,
      Limit: 25,
    })
  )

  const items = (out.Items || []) as any[]
  const active = items.find((it) => it && it.active !== false)
  if (!active) {
    const err = new Error(`Schema not found or inactive: ${schemaId}`)
    ;(err as any).statusCode = 400
    throw err
  }

  const version = Number(active.version || 1)
  return { schema: active, version }
}

/**
 * Build shareable URLs. We prefer returning RELATIVE paths to avoid depending on host/proxy config.
 * - claimUrl uses hash fragment so tokens do not hit server logs
 * - verifyUrl uses hash fragment to match your /verify auto-hash support
 */
function buildShareUrls(jwt: string) {
  const enc = encodeURIComponent(jwt)
  return {
    claimUrl: `/wallet#claim=${enc}`,
    verifyUrl: `/verify#t=${enc}`,
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rid = makeRid(req)
  const debug = isDebugErrorsEnabled()
  const startedAt = Date.now()

  try {
    if (req.method !== 'POST') {
      return json(res, 405, { ok: false, error: 'Method not allowed', rid })
    }

    requireAdmin(req)

    const body = (parseBody(req) as IssueBody) || ({} as IssueBody)

    const missing: string[] = []
    const schemaId = (body.schemaId || body.type || '').toString().trim()
    if (!schemaId) missing.push('schemaId')
    if (!body?.title) missing.push('title')
    if (!body?.issuerName) missing.push('issuerName')
    if (!body?.subjectName) missing.push('subjectName')

    if (missing.length) {
      console.warn('[api/issue] Missing fields', { rid, missing })
      return json(res, 400, { ok: false, error: `Missing fields: ${missing.join(', ')}`, rid })
    }

    const orgId = getOrgId(body)
    const nowIso = new Date().toISOString()

    const exp = parseExpires(body.expiresAt) ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365
    const ttl = computeTtlFromExp(exp)

    const credentialId =
      (globalThis.crypto as any)?.randomUUID?.() ||
      crypto.randomUUID?.() ||
      `cred_${Date.now()}_${Math.random().toString(16).slice(2)}`

    const ddb = makeDdb()

    // 1) load schema (latest active) — required, return 400 with clear hint if missing
    let schemaVersion = 1
    try {
      const schemaOut = await getLatestActiveSchema(ddb, orgId, schemaId)
      schemaVersion = schemaOut.version
    } catch (e: any) {
      const statusCode = Number(e?.statusCode || 400)
      const msg = e?.message || `Schema not found or inactive: ${schemaId}`
      console.warn('[api/issue] schema resolution failed', {
        rid,
        orgId,
        schemaId,
        statusCode,
        message: msg,
      })
      return json(res, statusCode, {
        ok: false,
        rid,
        error: msg,
        hint: 'Create/activate this schema first (or POST /api/issuer/seed-default-schemas).',
      })
    }

    // 2) sign JWT
    const iss = issuerIssuer()
    const aud = issuerAudience()
    const { key, alg, kid } = await getPrivateSigningKey()

    const payload = {
      cid: credentialId,
      orgId,
      schemaId,
      schemaVersion,
      title: body.title,
      issuerName: body.issuerName,
      subjectName: body.subjectName,
      claims: body.claims || {},
      v: 1,
    }

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg, typ: 'JWT', ...(kid ? { kid } : {}) })
      .setIssuer(iss)
      .setAudience(aud)
      .setIssuedAt()
      .setExpirationTime(exp)
      .sign(key as any)

    const { claimUrl, verifyUrl } = buildShareUrls(jwt)

    // 3) write credential metadata to Dynamo
    const credentialsTable = requireEnv('LATIMERE_CREDENTIALS_TABLE')
    await ddb.send(
      new PutCommand({
        TableName: credentialsTable,
        Item: {
          pk: `ORG#${orgId}`,
          sk: `CRED#${credentialId}`,
          entity: 'CREDENTIAL',
          orgId,
          credentialId,
          schemaId,
          schemaVersion,
          title: body.title,
          issuerName: body.issuerName,
          subjectName: body.subjectName,
          claims: body.claims || {},
          exp,
          createdAt: nowIso,
          createdBy: 'dev-admin',
          ttl,
        },
      })
    )

    // 4) status ACTIVE (in-memory if no table, Dynamo if table configured)
    const store = getStatusStore()
    await store.setActive(credentialId, ttl)

    // 5) audit log (best effort)
    try {
      const auditTable = requireEnv('LATIMERE_AUDIT_TABLE')
      const auditId = crypto.randomUUID()
      await ddb.send(
        new PutCommand({
          TableName: auditTable,
          Item: {
            pk: `ORG#${orgId}`,
            sk: `TS#${nowIso}#${auditId}`,
            entity: 'AUDIT',
            orgId,
            auditId,
            ts: nowIso,
            action: 'ISSUE',
            actorSub: 'dev-admin',
            actorEmail: 'dev-admin@local',
            schemaId,
            detail: {
              credentialId,
              title: body.title,
              subjectName: body.subjectName,
              schemaVersion,
            },
          },
        })
      )
    } catch (e: any) {
      console.warn('[api/issue] audit write failed (non-fatal)', {
        rid,
        orgId,
        schemaId,
        credentialId,
        message: e?.message,
      })
    }

    console.info('[api/issue] Issued', {
      rid,
      orgId,
      schemaId,
      schemaVersion,
      credentialId,
      alg,
      hasKid: !!kid,
      exp,
      ms: Date.now() - startedAt,
    })

    return json(res, 200, {
      ok: true,
      rid,
      orgId,
      credentialId,
      jwt,
      exp,
      claimUrl,
      verifyUrl,
    })
  } catch (err: any) {
    const statusCode = Number(err?.statusCode || err?.status || 500)
    const message = err?.message || 'Internal error'
    const stack = err?.stack

    console.error('[api/issue] Error', {
      rid,
      statusCode,
      message,
      stack: debug ? stack : undefined,
      ms: Date.now() - startedAt,
    })

    return json(res, statusCode, {
      ok: false,
      rid,
      error: debug ? message : 'Internal error',
      ...(debug ? { stack } : {}),
    })
  }
}

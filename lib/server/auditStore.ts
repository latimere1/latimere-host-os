import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { getDdbDoc, pkOrg, table } from './ddb'

export type AuditAction = 'ISSUE' | 'REVOKE' | 'SCHEMA_CREATE'

export type AuditEntry = {
  orgId: string
  auditId: string
  ts: string
  actorSub?: string
  actorEmail?: string
  action: AuditAction
  credentialId?: string
  schemaId?: string
  detail?: any
}

function skAudit(ts: string, auditId: string) {
  return `TS#${ts}#${auditId}`
}

function uuid() {
  return (globalThis.crypto as any)?.randomUUID?.() || `a_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export async function writeAudit(entry: Omit<AuditEntry, 'auditId' | 'ts'> & { ts?: string; auditId?: string }) {
  const { doc } = getDdbDoc()
  const auditId = entry.auditId || uuid()
  const ts = entry.ts || new Date().toISOString()
  const item = {
    pk: pkOrg(entry.orgId),
    sk: skAudit(ts, auditId),
    entity: 'AUDIT',
    auditId,
    ts,
    ...entry,
  }
  await doc.send(new PutCommand({ TableName: table('AUDIT'), Item: item }))
  return item
}

export async function listAudit(orgId: string, limit = 50) {
  const { doc } = getDdbDoc()
  const resp = await doc.send(
    new QueryCommand({
      TableName: table('AUDIT'),
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :pfx)',
      ExpressionAttributeValues: { ':pk': pkOrg(orgId), ':pfx': 'TS#' },
      ScanIndexForward: false,
      Limit: limit,
    })
  )
  return (resp.Items || []) as any[]
}

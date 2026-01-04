import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { getDdbDoc, pkOrg, table } from './ddb'

export type CredentialSchema = {
  orgId: string
  schemaId: string
  version: number
  name: string
  description?: string
  jsonSchema: any
  uiSchema?: any
  active: boolean
  createdAt: string
  createdBy?: string
}

function skSchema(schemaId: string, version: number) {
  return `SCHEMA#${schemaId}#V#${String(version).padStart(6, '0')}`
}

export async function putSchema(s: CredentialSchema) {
  const { doc } = getDdbDoc()
  const item = {
    pk: pkOrg(s.orgId),
    sk: skSchema(s.schemaId, s.version),
    ...s,
    entity: 'SCHEMA',
  }
  await doc.send(new PutCommand({ TableName: table('SCHEMAS'), Item: item }))
  return item
}

export async function getSchemaLatest(orgId: string, schemaId: string) {
  const { doc } = getDdbDoc()
  const pk = pkOrg(orgId)
  const prefix = `SCHEMA#${schemaId}#V#`
  const resp = await doc.send(
    new QueryCommand({
      TableName: table('SCHEMAS'),
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :pfx)',
      ExpressionAttributeValues: { ':pk': pk, ':pfx': prefix },
      ScanIndexForward: false,
      Limit: 1,
    })
  )
  return (resp.Items?.[0] as any) || null
}

export async function listSchemas(orgId: string) {
  const { doc } = getDdbDoc()
  const pk = pkOrg(orgId)
  const resp = await doc.send(
    new QueryCommand({
      TableName: table('SCHEMAS'),
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :pfx)',
      ExpressionAttributeValues: { ':pk': pk, ':pfx': 'SCHEMA#' },
      ScanIndexForward: false,
    })
  )
  const items = (resp.Items || []) as any[]
  // return latest version per schemaId
  const latest = new Map<string, any>()
  for (const it of items) {
    const sid = it.schemaId
    if (!latest.has(sid)) latest.set(sid, it)
  }
  return Array.from(latest.values())
}

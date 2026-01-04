import { PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { getDdbDoc, pkOrg, table } from './ddb'

export type CredentialMeta = {
  orgId: string
  credentialId: string
  schemaId: string
  schemaVersion: number
  title: string
  issuerName: string
  subjectName: string
  issuedAt: string
  expiresAt: string
  status: 'ACTIVE' | 'REVOKED'
}

function skCred(credentialId: string) {
  return `CRED#${credentialId}`
}

export async function putCredentialMeta(m: CredentialMeta) {
  const { doc } = getDdbDoc()
  const item = {
    pk: pkOrg(m.orgId),
    sk: skCred(m.credentialId),
    entity: 'CREDENTIAL',
    ...m,
  }
  await doc.send(new PutCommand({ TableName: table('CREDENTIALS'), Item: item }))
  return item
}

export async function getCredentialMeta(orgId: string, credentialId: string) {
  const { doc } = getDdbDoc()
  const resp = await doc.send(
    new GetCommand({
      TableName: table('CREDENTIALS'),
      Key: { pk: pkOrg(orgId), sk: skCred(credentialId) },
    })
  )
  return (resp.Item as any) || null
}

export async function setCredentialRevoked(orgId: string, credentialId: string) {
  const { doc } = getDdbDoc()
  await doc.send(
    new UpdateCommand({
      TableName: table('CREDENTIALS'),
      Key: { pk: pkOrg(orgId), sk: skCred(credentialId) },
      UpdateExpression: 'SET #s = :r',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':r': 'REVOKED' },
    })
  )
}

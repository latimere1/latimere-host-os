// lib/server/credentialStatusStore.ts
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { getDynamoDoc } from './dynamo'

export type CredentialStatus = 'ACTIVE' | 'REVOKED'

export type CredentialStatusRecord = {
  credentialId: string
  status: CredentialStatus
  issuer?: string
  issuedAt?: string
  expiresAt?: string
  revokedAt?: string
  revokeReason?: string
  updatedAt: string
}

export interface ICredentialStatusStore {
  get(credentialId: string): Promise<CredentialStatusRecord | null>
  markActive(input: {
    credentialId: string
    issuer?: string
    issuedAt?: string
    expiresAt?: string
  }): Promise<void>
  revoke(input: { credentialId: string; reason?: string; issuer?: string }): Promise<void>
}

function tableName() {
  const t = process.env.LATIMERE_DDB_TABLE_STATUS
  if (!t) throw new Error('Missing env LATIMERE_DDB_TABLE_STATUS')
  return t
}

function nowIso() {
  return new Date().toISOString()
}

export class DynamoCredentialStatusStore implements ICredentialStatusStore {
  async get(credentialId: string) {
    const doc = getDynamoDoc()
    const res = await doc.send(
      new GetCommand({
        TableName: tableName(),
        Key: { credentialId },
      })
    )
    return (res.Item as CredentialStatusRecord) || null
  }

  async markActive(input: {
    credentialId: string
    issuer?: string
    issuedAt?: string
    expiresAt?: string
  }) {
    const doc = getDynamoDoc()
    const updatedAt = nowIso()

    await doc.send(
      new PutCommand({
        TableName: tableName(),
        Item: {
          credentialId: input.credentialId,
          status: 'ACTIVE',
          issuer: input.issuer,
          issuedAt: input.issuedAt,
          expiresAt: input.expiresAt,
          updatedAt,
        } satisfies CredentialStatusRecord,
        ConditionExpression: 'attribute_not_exists(credentialId)',
      })
    )

    console.info('[StatusStore] markActive', { credentialId: input.credentialId })
  }

  async revoke(input: { credentialId: string; reason?: string; issuer?: string }) {
    const doc = getDynamoDoc()
    const updatedAt = nowIso()
    const revokedAt = nowIso()

    await doc.send(
      new UpdateCommand({
        TableName: tableName(),
        Key: { credentialId: input.credentialId },
        UpdateExpression:
          'SET #status = :rev, revokedAt = :revokedAt, revokeReason = :reason, updatedAt = :updatedAt, issuer = if_not_exists(issuer, :issuer)',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':rev': 'REVOKED',
          ':revokedAt': revokedAt,
          ':reason': input.reason || 'Revoked',
          ':updatedAt': updatedAt,
          ':issuer': input.issuer || 'unknown',
        },
      })
    )

    console.warn('[StatusStore] revoke', { credentialId: input.credentialId })
  }
}

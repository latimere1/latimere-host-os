// pages/api/invitations/lookup.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'

const REGION =
  process.env.AWS_REGION ||
  process.env.REGION ||
  process.env.NEXT_PUBLIC_AWS_REGION ||
  'us-east-1'

const TABLE = process.env.INVITATION_TABLE // e.g., Invitation-xxxx-dev
const ddb = new DynamoDBClient({ region: REGION })

type Ok = {
  ok: true
  invitation: {
    id: string
    owner: string
    email: string
    role?: string
    status: string
    tokenHash?: string
    expiresAt?: string
    lastSentAt?: string
    createdAt?: string
    updatedAt?: string
  } | null
  trace?: { region: string; table: string; now: string }
}
type Err = { ok: false; error: string; details?: any }

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  const start = Date.now()
  const log = (...args: any[]) => console.log('[lookup]', ...args)

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' })
    }

    if (!TABLE) {
      log('❌ Missing INVITATION_TABLE in env')
      return res.status(500).json({ ok: false, error: 'Server not configured (INVITATION_TABLE)' })
    }

    const { id } = (req.body || {}) as { id?: string }
    if (!id) {
      return res.status(400).json({ ok: false, error: 'Missing id' })
    }

    log('→ DDB GET', { region: REGION, table: TABLE, id })

    const resp = await ddb.send(
      new GetItemCommand({
        TableName: TABLE,
        Key: { id: { S: String(id) } },
        ConsistentRead: true,
        ProjectionExpression:
          '#id, #owner, #email, #role, #status, #tokenHash, #expiresAt, #lastSentAt, #createdAt, #updatedAt',
        ExpressionAttributeNames: {
          '#id': 'id',
          '#owner': 'owner',
          '#email': 'email',
          '#role': 'role',
          '#status': 'status',
          '#tokenHash': 'tokenHash',
          '#expiresAt': 'expiresAt',
          '#lastSentAt': 'lastSentAt',
          '#createdAt': 'createdAt',
          '#updatedAt': 'updatedAt',
        },
      })
    )

    const it = resp.Item
    if (!it) {
      log('↪︎ not found', id, `(${Date.now() - start}ms)`)
      return res.status(200).json({
        ok: true,
        invitation: null,
        trace: { region: REGION, table: TABLE!, now: new Date().toISOString() },
      })
    }

    const invitation = {
      id: it.id?.S || '',
      owner: it.owner?.S || '',
      email: it.email?.S || '',
      role: it.role?.S,
      status: it.status?.S || '',
      tokenHash: it.tokenHash?.S,
      expiresAt: it.expiresAt?.S,
      lastSentAt: it.lastSentAt?.S,
      createdAt: it.createdAt?.S,
      updatedAt: it.updatedAt?.S,
    }

    log('✓ found', {
      id: invitation.id,
      status: invitation.status,
      hasTokenHash: !!invitation.tokenHash,
    })

    return res.status(200).json({
      ok: true,
      invitation,
      trace: { region: REGION, table: TABLE!, now: new Date().toISOString() },
    })
  } catch (e: any) {
    console.error('[lookup] ERROR', e)
    return res.status(500).json({
      ok: false,
      error: e?.message || 'Lookup failed',
      details: { name: e?.name, stack: e?.stack },
    })
  }
}

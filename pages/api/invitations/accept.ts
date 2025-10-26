// pages/api/invitations/accept.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'

type Ok = {
  ok: true
  result: {
    affiliation?: any
    invitation?: any
  }
  warnings?: string[]
  debug?: Record<string, any>
}
type Err = { ok: false; error: string; details?: any }

const APP_SYNC_URL =
  process.env.APPSYNC_GRAPHQL_ENDPOINT || process.env.NEXT_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT!
const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
const TABLE = process.env.INVITATION_TABLE
const OWNER_FIELD_ENV = (process.env.AFFILIATION_OWNER_FIELD || '').trim() || undefined

async function gqlFetch(query: string, variables: Record<string, any>, idToken: string) {
  const resp = await fetch(APP_SYNC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // For Cognito User Pools auth: send the RAW IdToken (no "Bearer ")
      Authorization: idToken,
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await resp.json().catch(() => ({}))
  return { status: resp.status, ok: resp.ok && !json?.errors, json }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  const log = (...a: any[]) => console.log('[acceptAPI]', ...a)
  const warn = (...a: any[]) => console.warn('[acceptAPI]', ...a)
  const error = (...a: any[]) => console.error('[acceptAPI]', ...a)

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' })
    }
    if (!TABLE) {
      return res.status(500).json({ ok: false, error: 'Server missing INVITATION_TABLE' })
    }

    // Pull & sanitize auth header (client sends "Bearer <idToken>")
    const auth = req.headers.authorization || ''
    const idToken = auth.replace(/^Bearer\s+/i, '')
    if (!idToken) {
      return res.status(401).json({ ok: false, error: 'Valid authorization header not provided.' })
    }

    const { id, tokenHash, ownerSub, cleanerUsername, cleanerDisplay } = (req.body || {}) as {
      id?: string
      tokenHash?: string
      ownerSub?: string
      cleanerUsername?: string
      cleanerDisplay?: string
    }

    if (!id || !tokenHash || !ownerSub || !cleanerUsername) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields (id, tokenHash, ownerSub, cleanerUsername)',
      })
    }

    log('➡️ start', { id, region: REGION, table: TABLE })

    // 1) Strongly re-read Invitation for defense-in-depth
    const ddb = new DynamoDBClient({ region: REGION })
    const getResp = await ddb.send(
      new GetItemCommand({
        TableName: TABLE,
        Key: { id: { S: String(id) } },
        ConsistentRead: true,
        ProjectionExpression:
          '#id,#owner,#email,#role,#status,#tokenHash,#expiresAt,#lastSentAt,#createdAt,#updatedAt',
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

    const it = getResp.Item
    if (!it) {
      warn('↪︎ invitation not found', id)
      return res.status(404).json({ ok: false, error: 'Invite not found.' })
    }
    const invite = {
      id: it.id?.S || '',
      owner: it.owner?.S || '',
      email: it.email?.S || '',
      role: it.role?.S || '',
      status: it.status?.S || '',
      tokenHash: it.tokenHash?.S || '',
      expiresAt: it.expiresAt?.S || '',
    }
    log('📄 invite', { id: invite.id, status: invite.status })

    // 2) Validate
    const notExpired = !invite.expiresAt || new Date(invite.expiresAt) > new Date()
    const matches = invite.tokenHash && tokenHash && invite.tokenHash === tokenHash
    if (!(invite.status === 'PENDING' && notExpired && matches)) {
      const why =
        invite.status !== 'PENDING'
          ? `status=${invite.status}`
          : !notExpired
          ? 'expired'
          : 'token mismatch'
      return res.status(400).json({ ok: false, error: `Invite not valid (${why}).` })
    }

    // 3) Try to create CleanerAffiliation via AppSync
    const warnings: string[] = []
    const ownerFieldPrimary = (OWNER_FIELD_ENV as 'owner' | 'ownerSub') || 'owner'
    const ownerFieldAlt = ownerFieldPrimary === 'owner' ? 'ownerSub' : 'owner'

    const createAffMutation = /* GraphQL */ `
      mutation CreateCleanerAffiliation($input: CreateCleanerAffiliationInput!) {
        createCleanerAffiliation(input: $input) { id __typename }
      }
    `
    async function tryCreate(ownerFieldName: 'owner' | 'ownerSub') {
      const input: Record<string, any> = {
        [ownerFieldName]: ownerSub,
        cleanerUsername,
        cleanerDisplay: cleanerDisplay || cleanerUsername,
      }
      log('🧪 createCleanerAffiliation try', { ownerFieldName, forOwner: '***' })
      return gqlFetch(createAffMutation, { input }, idToken)
    }

    let affData: any | undefined
    let try1 = await tryCreate(ownerFieldPrimary)
    if (try1.ok) {
      affData = try1.json?.data?.createCleanerAffiliation
    } else {
      const fieldUndefined =
        Array.isArray(try1.json?.errors) &&
        try1.json.errors.some((x: any) =>
          /Field .* is undefined .* createCleanerAffiliation/i.test(String(x?.message || ''))
        )
      if (fieldUndefined) {
        log('↩️ retrying with alternate owner field', { alt: ownerFieldAlt })
        const try2 = await tryCreate(ownerFieldAlt)
        if (try2.ok) {
          affData = try2.json?.data?.createCleanerAffiliation
        } else {
          warn('⚠️ affiliation creation failed (alt field)', {
            status: try2.status,
            errors: try2.json?.errors,
          })
          warnings.push('Affiliation create failed: ' + (try2.json?.errors?.[0]?.message || 'See logs'))
        }
      } else {
        warn('⚠️ affiliation creation failed (primary field)', {
          status: try1.status,
          errors: try1.json?.errors,
        })
        warnings.push('Affiliation create failed: ' + (try1.json?.errors?.[0]?.message || 'See logs'))
      }
    }

    // 4) Mark invitation ACCEPTED regardless of affiliation outcome,
    //    so the UX can continue; we still surface warnings.
    const upd = await ddb.send(
      new UpdateItemCommand({
        TableName: TABLE,
        Key: { id: { S: String(invite.id) } },
        UpdateExpression: 'SET #s = :accepted',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':accepted': { S: 'ACCEPTED' } },
        ReturnValues: 'ALL_NEW',
      })
    )
    log('✅ invitation status -> ACCEPTED', { id: invite.id })

    return res.status(200).json({
      ok: true,
      result: {
        affiliation: affData,
        invitation: { id: invite.id, status: 'ACCEPTED' },
      },
      warnings: warnings.length ? warnings : undefined,
      debug: warnings.length
        ? { affiliationErrors: warnings, ownerFieldTried: ownerFieldPrimary }
        : undefined,
    })
  } catch (e: any) {
    error('ERROR', e)
    return res.status(500).json({
      ok: false,
      error: e?.message || 'Accept failed',
      details: { status: e?.status, errors: e?.errors, data: e?.data },
    })
  }
}

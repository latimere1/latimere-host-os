import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

function log(level: 'debug' | 'info' | 'warn' | 'error', msg: string, meta?: any) {
  const envLevel = (process.env.LATIMERE_API_LOG_LEVEL || process.env.LOG_LEVEL || 'info').toLowerCase()
  const order = { debug: 10, info: 20, warn: 30, error: 40 } as const
  if ((order[level] ?? 20) < (order[envLevel as keyof typeof order] ?? 20)) return
  // eslint-disable-next-line no-console
  console[level](`[ddb] ${msg}`, meta || '')
}

export function getDdbDoc() {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
  const client = new DynamoDBClient({ region })
  const doc = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  })
  return { doc, log }
}

export function requireEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

export function table(name: 'SCHEMAS' | 'AUDIT' | 'CREDENTIALS') {
  if (name === 'SCHEMAS') return requireEnv('LATIMERE_SCHEMAS_TABLE')
  if (name === 'AUDIT') return requireEnv('LATIMERE_AUDIT_TABLE')
  return requireEnv('LATIMERE_CREDENTIALS_TABLE')
}

export function defaultOrgId() {
  return process.env.LATIMERE_DEFAULT_ORG_ID || 'org_default'
}

export function pkOrg(orgId: string) {
  return `ORG#${orgId}`
}

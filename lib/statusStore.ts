// lib/statusStore.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, DescribeCommand } from '@aws-sdk/lib-dynamodb'

export type CredentialStatus = 'ACTIVE' | 'REVOKED' | 'UNKNOWN'

export type StatusRecord = {
  credentialId: string
  status: Exclude<CredentialStatus, 'UNKNOWN'>
  updatedAt: string
  reason?: string
  ttl?: number
}

export interface StatusStore {
  getStatus(credentialId: string): Promise<StatusRecord | null>
  setActive(credentialId: string, ttl?: number): Promise<StatusRecord>
  setRevoked(credentialId: string, reason?: string, ttl?: number): Promise<StatusRecord>
}

// Small in-proc cache to reduce Dynamo reads; safe in dev.
const mem = new Map<string, StatusRecord>()
const memExp = new Map<string, number>() // key -> expiresAtMs
const MEM_CACHE_MS = Number(process.env.LATIMERE_STATUS_MEM_TTL_MS || 30_000) // default 30s

function envLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
  const v = (process.env.LATIMERE_API_LOG_LEVEL || process.env.LOG_LEVEL || 'info').toLowerCase()
  if (v === 'debug' || v === 'info' || v === 'warn' || v === 'error') return v
  return 'info'
}
const LOG_LEVEL = envLogLevel()
const LOG_DDB = (process.env.LATIMERE_LOG_DDB || '').trim() === '1'

function shouldLog(level: 'debug' | 'info' | 'warn' | 'error') {
  const order = { debug: 10, info: 20, warn: 30, error: 40 } as const
  return order[level] >= order[LOG_LEVEL]
}
function logDebug(msg: string, data?: any) {
  if (shouldLog('debug')) console.debug(msg, data ?? {})
}
function logInfo(msg: string, data?: any) {
  if (shouldLog('info')) console.info(msg, data ?? {})
}
function logWarn(msg: string, data?: any) {
  if (shouldLog('warn')) console.warn(msg, data ?? {})
}

function nowIso() {
  return new Date().toISOString()
}
function getRegion(): string | undefined {
  return (process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '').trim() || undefined
}
function normalizeTableName(v?: string): string {
  return (v || '').trim()
}
function isResourceNotFound(err: any): boolean {
  const name = err?.name || err?.code
  return name === 'ResourceNotFoundException' || name === 'NotFoundException'
}

function memGet(credentialId: string): StatusRecord | null {
  const expAt = memExp.get(credentialId) || 0
  if (expAt && Date.now() > expAt) {
    mem.delete(credentialId)
    memExp.delete(credentialId)
    return null
  }
  return mem.get(credentialId) || null
}
function memSet(rec: StatusRecord) {
  mem.set(rec.credentialId, rec)
  memExp.set(rec.credentialId, Date.now() + MEM_CACHE_MS)
}

class InMemoryStatusStore implements StatusStore {
  async getStatus(credentialId: string): Promise<StatusRecord | null> {
    const rec = memGet(credentialId)
    logDebug('[StatusStore:mem] getStatus', { credentialId, hit: !!rec })
    return rec
  }

  async setActive(credentialId: string, ttl?: number): Promise<StatusRecord> {
    const rec: StatusRecord = { credentialId, status: 'ACTIVE', updatedAt: nowIso(), ttl }
    memSet(rec)
    logDebug('[StatusStore:mem] setActive', { credentialId, ttl })
    return rec
  }

  async setRevoked(credentialId: string, reason?: string, ttl?: number): Promise<StatusRecord> {
    const rec: StatusRecord = { credentialId, status: 'REVOKED', updatedAt: nowIso(), reason, ttl }
    memSet(rec)
    logDebug('[StatusStore:mem] setRevoked', { credentialId, ttl, hasReason: !!reason })
    return rec
  }
}

class DynamoStatusStore implements StatusStore {
  private tableName: string
  private doc: DynamoDBDocumentClient
  private ready: Promise<void>

  constructor(tableName: string) {
    this.tableName = tableName
    const region = getRegion()
    const client = new DynamoDBClient(region ? { region } : {})
    this.doc = DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } })
    this.ready = this.validateTable()
  }

  private async validateTable(): Promise<void> {
    try {
      if (LOG_DDB) logInfo('[StatusStore:ddb] validating table', { tableName: this.tableName, region: getRegion() })
      await this.doc.send(new DescribeCommand({ TableName: this.tableName }))
      if (LOG_DDB) logInfo('[StatusStore:ddb] table OK', { tableName: this.tableName })
    } catch (err: any) {
      logWarn('[StatusStore:ddb] table validation failed (will fallback per-op)', {
        tableName: this.tableName,
        region: getRegion(),
        name: err?.name,
        message: err?.message,
      })
    }
  }

  private async ensureReady() {
    try {
      await this.ready
    } catch {}
  }

  async getStatus(credentialId: string): Promise<StatusRecord | null> {
    // First: serve from in-proc cache if fresh
    const cached = memGet(credentialId)
    if (cached) {
      logDebug('[StatusStore:cache] hit', { credentialId })
      return cached
    }

    await this.ensureReady()

    try {
      if (LOG_DDB) logDebug('[StatusStore:ddb] getStatus', { credentialId })
      const out = await this.doc.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { credentialId },
        })
      )
      const rec = (out.Item as StatusRecord) || null
      if (rec) memSet(rec)
      if (LOG_DDB) logDebug('[StatusStore:ddb] getStatus result', { credentialId, hit: !!rec })
      return rec
    } catch (err: any) {
      logWarn('[StatusStore:ddb] getStatus failed (degrading)', {
        credentialId,
        tableName: this.tableName,
        name: err?.name,
        message: err?.message,
      })
      return null
    }
  }

  async setActive(credentialId: string, ttl?: number): Promise<StatusRecord> {
    await this.ensureReady()
    const rec: StatusRecord = { credentialId, status: 'ACTIVE', updatedAt: nowIso(), ttl }

    try {
      if (LOG_DDB) logDebug('[StatusStore:ddb] setActive', { credentialId, ttl })
      await this.doc.send(new PutCommand({ TableName: this.tableName, Item: rec }))
      memSet(rec)
      return rec
    } catch (err: any) {
      logWarn('[StatusStore:ddb] setActive failed (fallback to mem)', {
        credentialId,
        tableName: this.tableName,
        name: err?.name,
        message: err?.message,
      })
      memSet(rec)
      if (isResourceNotFound(err)) {
        logWarn('[StatusStore] Dynamo table missing → using in-memory', { tableName: this.tableName })
      }
      return rec
    }
  }

  async setRevoked(credentialId: string, reason?: string, ttl?: number): Promise<StatusRecord> {
    await this.ensureReady()
    const rec: StatusRecord = { credentialId, status: 'REVOKED', updatedAt: nowIso(), reason, ttl }

    try {
      if (LOG_DDB) logDebug('[StatusStore:ddb] setRevoked', { credentialId, ttl, hasReason: !!reason })
      await this.doc.send(new PutCommand({ TableName: this.tableName, Item: rec }))
      memSet(rec)
      return rec
    } catch (err: any) {
      logWarn('[StatusStore:ddb] setRevoked failed (fallback to mem)', {
        credentialId,
        tableName: this.tableName,
        name: err?.name,
        message: err?.message,
      })
      memSet(rec)
      if (isResourceNotFound(err)) {
        logWarn('[StatusStore] Dynamo table missing → using in-memory', { tableName: this.tableName })
      }
      return rec
    }
  }
}

let singleton: StatusStore | null = null

export function getStatusStore(): StatusStore {
  if (singleton) return singleton

  const tableName = normalizeTableName(process.env.LATIMERE_STATUS_TABLE)
  if (tableName) {
    logInfo('[StatusStore] Using DynamoDB backend', {
      tableName,
      region: getRegion(),
      logDdb: LOG_DDB,
      memCacheMs: MEM_CACHE_MS,
    })
    singleton = new DynamoStatusStore(tableName)
    return singleton
  }

  logWarn('[StatusStore] LATIMERE_STATUS_TABLE not set → using in-memory backend (local/dev only)', {
    memCacheMs: MEM_CACHE_MS,
  })
  singleton = new InMemoryStatusStore()
  return singleton
}

// Keep existing helper (used by revoke/issue flows)
export function computeTtlFromExp(expEpochSeconds?: number): number | undefined {
  if (!expEpochSeconds) return undefined
  const paddingSeconds = 60 * 60 * 24 * 30 // 30 days
  return expEpochSeconds + paddingSeconds
}

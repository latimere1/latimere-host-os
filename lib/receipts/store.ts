// lib/receipts/store.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, DescribeCommand } from '@aws-sdk/lib-dynamodb'
import type { Receipt } from './types'

export interface ReceiptStore {
  get(receiptId: string): Promise<Receipt | null>
  put(receipt: Receipt): Promise<void>
}

function logInfo(msg: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') console.info(msg, data ?? {})
}
function logWarn(msg: string, data?: any) {
  console.warn(msg, data ?? {})
}

function nowEpochSeconds() {
  return Math.floor(Date.now() / 1000)
}

function computeReceiptTtlDays(): number {
  const raw = (process.env.LATIMERE_RECEIPT_TTL_DAYS || '30').trim()
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 30
}

function computeTtl(): number {
  const days = computeReceiptTtlDays()
  return nowEpochSeconds() + days * 24 * 60 * 60
}

class MemoryReceiptStore implements ReceiptStore {
  private byId = new Map<string, Receipt>()

  async get(receiptId: string) {
    return this.byId.get(receiptId) || null
  }

  async put(receipt: Receipt) {
    this.byId.set(receipt.receiptId, receipt)
  }
}

class DynamoReceiptStore implements ReceiptStore {
  private doc: DynamoDBDocumentClient
  private ready: Promise<void>

  constructor(private tableName: string) {
    const region = (process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '').trim()
    const client = new DynamoDBClient(region ? { region } : {})
    this.doc = DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } })
    this.ready = this.validate()
  }

  private async validate() {
    try {
      await this.doc.send(new DescribeCommand({ TableName: this.tableName }))
      logInfo('[ReceiptStore:ddb] table OK', { tableName: this.tableName })
    } catch (e: any) {
      logWarn('[ReceiptStore:ddb] table validation failed (will degrade)', {
        tableName: this.tableName,
        name: e?.name,
        message: e?.message,
      })
    }
  }

  private async ensureReady() {
    try {
      await this.ready
    } catch {}
  }

  async get(receiptId: string) {
    await this.ensureReady()
    try {
      const out = await this.doc.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { receiptId },
        })
      )
      return (out.Item as Receipt) || null
    } catch (e: any) {
      logWarn('[ReceiptStore:ddb] get failed', { receiptId, name: e?.name, message: e?.message })
      return null
    }
  }

  async put(receipt: Receipt) {
    await this.ensureReady()
    try {
      await this.doc.send(
        new PutCommand({
          TableName: this.tableName,
          Item: receipt,
          // Avoid accidental overwrite (receipts should be immutable)
          ConditionExpression: 'attribute_not_exists(receiptId)',
        })
      )
    } catch (e: any) {
      // If condition fails, treat as success (idempotent behavior in retries)
      if (e?.name === 'ConditionalCheckFailedException') return
      logWarn('[ReceiptStore:ddb] put failed (degrade)', { receiptId: receipt.receiptId, name: e?.name, message: e?.message })
      throw e
    }
  }
}

let singleton: ReceiptStore | null = null

export function getReceiptStore(): ReceiptStore {
  if (singleton) return singleton

  const tableName = (process.env.LATIMERE_RECEIPT_TABLE || '').trim()
  if (tableName) {
    logInfo('[ReceiptStore] Using DynamoDB backend', { tableName, ttlDays: computeReceiptTtlDays() })
    singleton = new DynamoReceiptStore(tableName)
    return singleton
  }

  logWarn('[ReceiptStore] LATIMERE_RECEIPT_TABLE not set → using in-memory receipts (will reset on restart)')
  singleton = new MemoryReceiptStore()
  return singleton
}

export function attachReceiptTtl(receipt: Receipt): Receipt {
  // Only used if you enable Dynamo TTL; harmless otherwise.
  return { ...receipt, ttl: computeTtl() }
}

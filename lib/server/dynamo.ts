// lib/server/dynamo.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

let _doc: DynamoDBDocumentClient | null = null

export function getDynamoDoc() {
  if (_doc) return _doc

  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION
  if (!region) {
    console.warn('[Dynamo] AWS_REGION/AWS_DEFAULT_REGION is not set')
  }

  const client = new DynamoDBClient({
    region,
  })

  _doc = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  })

  console.info('[Dynamo] initialized', { region })
  return _doc
}

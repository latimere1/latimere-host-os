// pages/api/debug-env.ts
import type { NextApiRequest, NextApiResponse } from 'next'

type DebugEnvResponse = {
  nodeEnv: string | undefined
  nextPublicEnv: string | undefined

  // Original flags (now reflect the *resolved* config: env vars OR Amplify JSON)
  hasAPPSYNC_GRAPHQL_ENDPOINT: boolean
  hasAPPSYNC_API_KEY: boolean
  hasNEXT_PUBLIC_AMPLIFY_JSON: boolean
  appsyncEndpointSample: string | null
  appsyncApiKeyLength: number

  // New diagnostic fields
  parseError: string | null
  amplifyJsonKeys: string[]
  rawAmplifyJsonSample: string | null
  sourceAPPSYNC_ENDPOINT: 'env' | 'amplifyJson' | 'none'
  sourceAPPSYNC_API_KEY: 'env' | 'amplifyJson' | 'none'
}

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse<DebugEnvResponse>
) {
  const rawEndpointEnv = process.env.APPSYNC_GRAPHQL_ENDPOINT || ''
  const rawApiKeyEnv = process.env.APPSYNC_API_KEY || ''
  const rawAmplifyJson = process.env.NEXT_PUBLIC_AMPLIFY_JSON

  let parsedAmplify: any = null
  let parseError: string | null = null
  let amplifyJsonKeys: string[] = []

  if (rawAmplifyJson) {
    try {
      parsedAmplify = JSON.parse(rawAmplifyJson)
      if (parsedAmplify && typeof parsedAmplify === 'object') {
        amplifyJsonKeys = Object.keys(parsedAmplify)
      }
    } catch (err: any) {
      parseError = err?.message || String(err)
      console.error('[debug-env] Failed to parse NEXT_PUBLIC_AMPLIFY_JSON', {
        message: parseError,
      })
    }
  }

  const endpointFromJson =
    typeof parsedAmplify?.aws_appsync_graphqlEndpoint === 'string'
      ? parsedAmplify.aws_appsync_graphqlEndpoint
      : ''

  const apiKeyFromJson =
    typeof parsedAmplify?.aws_appsync_apiKey === 'string'
      ? parsedAmplify.aws_appsync_apiKey
      : ''

  const resolvedEndpoint = rawEndpointEnv || endpointFromJson
  const resolvedApiKey = rawApiKeyEnv || apiKeyFromJson

  const sourceAPPSYNC_ENDPOINT: DebugEnvResponse['sourceAPPSYNC_ENDPOINT'] =
    rawEndpointEnv ? 'env' : endpointFromJson ? 'amplifyJson' : 'none'

  const sourceAPPSYNC_API_KEY: DebugEnvResponse['sourceAPPSYNC_API_KEY'] =
    rawApiKeyEnv ? 'env' : apiKeyFromJson ? 'amplifyJson' : 'none'

  console.log('[debug-env] Resolved AppSync configuration summary', {
    nodeEnv: process.env.NODE_ENV,
    hasNEXT_PUBLIC_AMPLIFY_JSON: !!rawAmplifyJson,
    parseError,
    amplifyJsonKeys,
    hasEnvEndpoint: !!rawEndpointEnv,
    hasEnvApiKey: !!rawApiKeyEnv,
    hasJsonEndpoint: !!endpointFromJson,
    hasJsonApiKey: !!apiKeyFromJson,
    resolvedEndpointSource: sourceAPPSYNC_ENDPOINT,
    resolvedApiKeySource: sourceAPPSYNC_API_KEY,
    resolvedEndpointSample: resolvedEndpoint
      ? resolvedEndpoint.slice(0, 60)
      : null,
    resolvedApiKeyLength: resolvedApiKey ? resolvedApiKey.length : 0,
  })

  const response: DebugEnvResponse = {
    nodeEnv: process.env.NODE_ENV,
    nextPublicEnv: process.env.NEXT_PUBLIC_ENV,

    // These now indicate whether we have a usable config from either source
    hasAPPSYNC_GRAPHQL_ENDPOINT: !!resolvedEndpoint,
    hasAPPSYNC_API_KEY: !!resolvedApiKey,
    hasNEXT_PUBLIC_AMPLIFY_JSON: !!rawAmplifyJson,
    appsyncEndpointSample: resolvedEndpoint
      ? resolvedEndpoint.slice(0, 60)
      : null,
    appsyncApiKeyLength: resolvedApiKey ? resolvedApiKey.length : 0,

    parseError,
    amplifyJsonKeys,
    rawAmplifyJsonSample: rawAmplifyJson
      ? rawAmplifyJson.slice(0, 400)
      : null,
    sourceAPPSYNC_ENDPOINT,
    sourceAPPSYNC_API_KEY,
  }

  res.status(200).json(response)
}

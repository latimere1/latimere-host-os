// pages/api/debug-env.ts
import type { NextApiRequest, NextApiResponse } from 'next'

type DebugEnvResponse = {
  nodeEnv: string | undefined
  nextPublicEnv: string | undefined
  hasAPPSYNC_GRAPHQL_ENDPOINT: boolean
  hasAPPSYNC_API_KEY: boolean
  hasNEXT_PUBLIC_AMPLIFY_JSON: boolean
  appsyncEndpointSample: string | null
  appsyncApiKeyLength: number
}

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse<DebugEnvResponse>
) {
  const endpoint = process.env.APPSYNC_GRAPHQL_ENDPOINT || ''
  const apiKey = process.env.APPSYNC_API_KEY || ''
  const amplifyJson = process.env.NEXT_PUBLIC_AMPLIFY_JSON || ''

  res.status(200).json({
    nodeEnv: process.env.NODE_ENV,
    nextPublicEnv: process.env.NEXT_PUBLIC_ENV,
    hasAPPSYNC_GRAPHQL_ENDPOINT: !!endpoint,
    hasAPPSYNC_API_KEY: !!apiKey,
    hasNEXT_PUBLIC_AMPLIFY_JSON: !!amplifyJson,
    // don’t leak secrets, just show a tiny sample + lengths
    appsyncEndpointSample: endpoint ? endpoint.slice(0, 60) : null,
    appsyncApiKeyLength: apiKey.length,
  })
}

// pages/api/revenue-audit/create.ts
/* eslint-disable no-console */
import type { NextApiRequest, NextApiResponse } from 'next'

type CreateAuditInputBody = {
  name?: string
  email?: string
  phone?: string
  market?: string
  listingUrl?: string
  bedrooms?: string
  sleeps?: string
  currentNightlyRate?: string
  currentOccupancy?: string
  notes?: string
}

type CreateRevenueAuditResponse = {
  data?: {
    createRevenueAudit?: {
      id: string
    } | null
  }
  errors?: any
}

type ResolvedAppSyncConfig = {
  endpoint: string
  apiKey: string
  source: 'env' | 'amplifyJson'
}

function resolveAppSyncConfigForApi(routeLabel: string): ResolvedAppSyncConfig | null {
  const envEndpoint = process.env.APPSYNC_GRAPHQL_ENDPOINT
  const envApiKey = process.env.APPSYNC_API_KEY

  if (envEndpoint && envApiKey) {
    console.log(`[${routeLabel}] Using AppSync config from env vars`)
    return { endpoint: envEndpoint, apiKey: envApiKey, source: 'env' }
  }

  const amplifyJsonRaw = process.env.NEXT_PUBLIC_AMPLIFY_JSON
  if (amplifyJsonRaw) {
    try {
      const parsed = JSON.parse(amplifyJsonRaw) as {
        aws_appsync_graphqlEndpoint?: string
        aws_appsync_apiKey?: string
      }

      if (parsed.aws_appsync_graphqlEndpoint && parsed.aws_appsync_apiKey) {
        console.log(
          `[${routeLabel}] Using AppSync config from NEXT_PUBLIC_AMPLIFY_JSON`
        )
        return {
          endpoint: parsed.aws_appsync_graphqlEndpoint,
          apiKey: parsed.aws_appsync_apiKey,
          source: 'amplifyJson',
        }
      }

      console.warn(
        `[${routeLabel}] NEXT_PUBLIC_AMPLIFY_JSON present but missing aws_appsync_graphqlEndpoint or aws_appsync_apiKey keys`
      )
    } catch (err) {
      console.error(
        `[${routeLabel}] Failed to parse NEXT_PUBLIC_AMPLIFY_JSON:`,
        err
      )
    }
  } else {
    console.warn(`[${routeLabel}] NEXT_PUBLIC_AMPLIFY_JSON not set`)
  }

  console.error(
    `[${routeLabel}] Missing AppSync config. APPSYNC_GRAPHQL_ENDPOINT / APPSYNC_API_KEY or NEXT_PUBLIC_AMPLIFY_JSON must be set.`
  )
  return null
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const routeLabel = 'RevenueAuditAPI'

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const appSyncConfig = resolveAppSyncConfigForApi(routeLabel)
  if (!appSyncConfig) {
    return res.status(500).json({
      ok: false,
      error:
        'Server is not configured for AppSync. Missing APPSYNC_GRAPHQL_ENDPOINT / APPSYNC_API_KEY or Amplify JSON config.',
    })
  }

  const body = req.body as CreateAuditInputBody
  if (process.env.DEBUG_REVENUE_AUDIT === '1') {
    console.log('[RevenueAuditAPI] Incoming body:', body)
  }

  const name = (body.name || '').trim()
  const email = (body.email || '').trim()
  const listingUrl = (body.listingUrl || '').trim()
  const market = (body.market || '').trim()
  const phone = (body.phone || '').trim()
  const bedrooms = (body.bedrooms || '').trim()
  const sleeps = (body.sleeps || '').trim()
  const currentNightlyRate = (body.currentNightlyRate || '').trim()
  const currentOccupancy = (body.currentOccupancy || '').trim()
  const notes = (body.notes || '').trim()

  if (!name || !email || !listingUrl) {
    return res.status(400).json({
      ok: false,
      error: 'Missing required fields: name, email, and listingUrl are required.',
    })
  }

  // Pack intake details into a single text field for now
  const intakeDetails = [
    phone && `Phone: ${phone}`,
    market && `Market: ${market}`,
    bedrooms && `Bedrooms: ${bedrooms}`,
    sleeps && `Sleeps: ${sleeps}`,
    currentNightlyRate && `Typical nightly rate: ${currentNightlyRate}`,
    currentOccupancy && `Approx occupancy: ${currentOccupancy}%`,
    notes && `Notes: ${notes}`,
  ]
    .filter(Boolean)
    .join('\n')

  const gqlInput: Record<string, any> = {
    owner: 'latimere-intake', // system owner; admins read these
    ownerName: name,
    ownerEmail: email,
    listingUrl,
    marketName: market || null,
    recommendations: intakeDetails || null,
  }

  if (process.env.DEBUG_REVENUE_AUDIT === '1') {
    console.log('[RevenueAuditAPI] GraphQL input:', gqlInput)
  }

  const CREATE_REVENUE_AUDIT = /* GraphQL */ `
    mutation CreateRevenueAudit($input: CreateRevenueAuditInput!) {
      createRevenueAudit(input: $input) {
        id
        listingUrl
        marketName
        ownerName
        ownerEmail
        createdAt
      }
    }
  `

  try {
    const payload = {
      query: CREATE_REVENUE_AUDIT,
      variables: { input: gqlInput },
    }

    const response = await fetch(appSyncConfig.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': appSyncConfig.apiKey,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(
        '[RevenueAuditAPI] AppSync HTTP error:',
        response.status,
        response.statusText,
        text
      )
      return res.status(502).json({
        ok: false,
        error: `AppSync request failed with status ${response.status}`,
        details: text,
      })
    }

    const json = (await response.json()) as CreateRevenueAuditResponse

    if (json.errors && json.errors.length) {
      console.error('[RevenueAuditAPI] AppSync GraphQL errors:', json.errors)
      return res.status(502).json({
        ok: false,
        error: 'AppSync GraphQL error',
        details: json.errors,
      })
    }

    const created = json.data?.createRevenueAudit ?? null
    if (!created) {
      console.warn('[RevenueAuditAPI] No createRevenueAudit returned')
      return res.status(500).json({
        ok: false,
        error: 'RevenueAudit creation returned no record.',
      })
    }

    if (process.env.DEBUG_REVENUE_AUDIT === '1') {
      console.log('[RevenueAuditAPI] Created RevenueAudit:', created)
    }

    return res.status(200).json({
      ok: true,
      id: created.id,
    })
  } catch (err) {
    console.error('[RevenueAuditAPI] Unexpected error:', err)
    return res.status(500).json({
      ok: false,
      error: 'Unexpected server error while creating RevenueAudit.',
    })
  }
}

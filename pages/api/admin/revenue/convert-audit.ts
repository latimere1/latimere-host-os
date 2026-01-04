// pages/api/admin/revenue/convert-audit.ts
/* eslint-disable no-console */
import type { NextApiRequest, NextApiResponse } from 'next'

const debugConvertAudit = process.env.DEBUG_REVENUE_EMAIL === '1' || process.env.DEBUG_REVENUE_AUDIT === '1'

type ResolvedAppSyncConfig = {
  endpoint: string
  apiKey: string
  source: 'env' | 'amplifyJson'
}

type RevenueAuditMinimal = {
  id: string
  propertyId?: string | null
  owner?: string | null
  ownerName?: string | null
  ownerEmail?: string | null
  listingUrl?: string | null
  marketName?: string | null
}

type GetRevenueAuditResponse = {
  getRevenueAudit?: RevenueAuditMinimal | null
}

type CreatePropertyResponse = {
  createProperty?: {
    id: string
    name?: string | null
    address?: string | null
    sleeps?: number | null
    owner: string
  } | null
}

type CreateRevenueProfileResponse = {
  createRevenueProfile?: {
    id: string
  } | null
}

type UpdateRevenueAuditResponse = {
  updateRevenueAudit?: {
    id: string
    propertyId?: string | null
  } | null
}

const GET_REVENUE_AUDIT = /* GraphQL */ `
  query GetRevenueAudit($id: ID!) {
    getRevenueAudit(id: $id) {
      id
      propertyId
      owner
      ownerName
      ownerEmail
      listingUrl
      marketName
    }
  }
`

const CREATE_PROPERTY = /* GraphQL */ `
  mutation CreateProperty($input: CreatePropertyInput!) {
    createProperty(input: $input) {
      id
      name
      address
      sleeps
      owner
    }
  }
`

const CREATE_REVENUE_PROFILE = /* GraphQL */ `
  mutation CreateRevenueProfile($input: CreateRevenueProfileInput!) {
    createRevenueProfile(input: $input) {
      id
    }
  }
`

const UPDATE_REVENUE_AUDIT = /* GraphQL */ `
  mutation UpdateRevenueAudit($input: UpdateRevenueAuditInput!) {
    updateRevenueAudit(input: $input) {
      id
      propertyId
    }
  }
`

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
  const routeLabel = 'ConvertAuditAPI'

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

  const { auditId } = req.body as { auditId?: string }

  if (!auditId) {
    return res.status(400).json({
      ok: false,
      error: 'Missing required field: auditId',
    })
  }

  if (debugConvertAudit) {
    console.log('[ConvertAuditAPI] Incoming request body:', req.body)
  }

  try {
    // 1) Load the audit
    const getPayload = {
      query: GET_REVENUE_AUDIT,
      variables: { id: auditId },
    }

    if (debugConvertAudit) {
      console.log('[ConvertAuditAPI] Fetching RevenueAudit from AppSync:', getPayload)
    }

    const getResp = await fetch(appSyncConfig.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': appSyncConfig.apiKey,
      },
      body: JSON.stringify(getPayload),
    })

    if (!getResp.ok) {
      const text = await getResp.text()
      console.error(
        '[ConvertAuditAPI] AppSync HTTP error when loading audit:',
        getResp.status,
        getResp.statusText,
        text
      )
      return res.status(502).json({
        ok: false,
        error: `AppSync request (getRevenueAudit) failed with status ${getResp.status}`,
        details: text,
      })
    }

    const getJson = (await getResp.json()) as {
      data?: GetRevenueAuditResponse
      errors?: any
    }

    if (getJson.errors && getJson.errors.length) {
      console.error('[ConvertAuditAPI] AppSync GraphQL errors (getRevenueAudit):', getJson.errors)
      return res.status(502).json({
        ok: false,
        error: 'AppSync GraphQL error while loading RevenueAudit',
        details: getJson.errors,
      })
    }

    const audit = getJson.data?.getRevenueAudit ?? null
    if (!audit) {
      console.warn('[ConvertAuditAPI] No RevenueAudit found for id', auditId)
      return res.status(404).json({
        ok: false,
        error: 'RevenueAudit not found',
      })
    }

    if (debugConvertAudit) {
      console.log('[ConvertAuditAPI] Loaded RevenueAudit:', audit)
    }

    // If already linked to a Property, just return that property id
    if (audit.propertyId) {
      console.log(
        '[ConvertAuditAPI] Audit already linked to propertyId=',
        audit.propertyId
      )
      return res.status(200).json({
        ok: true,
        auditId: audit.id,
        propertyId: audit.propertyId,
        alreadyLinked: true,
      })
    }

    // 2) Create a skeleton Property
    const propertyOwner = audit.owner || 'latimere-intake'
    const propertyName =
      audit.marketName?.trim() ||
      (audit.listingUrl ? 'New STR from audit' : 'New STR property')
    const propertyAddress = 'TBD – created from revenue audit'
    const propertySleeps = 0

    const createPropertyInput = {
      name: propertyName,
      address: propertyAddress,
      sleeps: propertySleeps,
      owner: propertyOwner,
    }

    if (debugConvertAudit) {
      console.log(
        '[ConvertAuditAPI] CreateProperty input:',
        createPropertyInput
      )
    }

    const createPropertyPayload = {
      query: CREATE_PROPERTY,
      variables: { input: createPropertyInput },
    }

    const createPropertyResp = await fetch(appSyncConfig.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': appSyncConfig.apiKey,
      },
      body: JSON.stringify(createPropertyPayload),
    })

    if (!createPropertyResp.ok) {
      const text = await createPropertyResp.text()
      console.error(
        '[ConvertAuditAPI] AppSync HTTP error (createProperty):',
        createPropertyResp.status,
        createPropertyResp.statusText,
        text
      )
      return res.status(502).json({
        ok: false,
        error: `AppSync request (createProperty) failed with status ${createPropertyResp.status}`,
        details: text,
      })
    }

    const createPropertyJson = (await createPropertyResp.json()) as {
      data?: CreatePropertyResponse
      errors?: any
    }

    if (createPropertyJson.errors && createPropertyJson.errors.length) {
      console.error(
        '[ConvertAuditAPI] AppSync GraphQL errors (createProperty):',
        createPropertyJson.errors
      )
      return res.status(502).json({
        ok: false,
        error: 'AppSync GraphQL error while creating Property',
        details: createPropertyJson.errors,
      })
    }

    const createdProperty = createPropertyJson.data?.createProperty ?? null
    if (!createdProperty) {
      console.warn('[ConvertAuditAPI] createProperty returned null:', createPropertyJson)
      return res.status(500).json({
        ok: false,
        error: 'Property creation returned no record.',
      })
    }

    const propertyId = createdProperty.id
    console.log('[ConvertAuditAPI] Created Property with id=', propertyId)

    // 3) Create a default RevenueProfile for that property
    const createProfileInput = {
      propertyId,
      owner: propertyOwner,
      tier: 'PRO',
      pricingCadence: 'DAILY',
      isActive: true,
      baseNightlyRate: null,
      targetOccupancyPct: 70,
      marketName: audit.marketName || null,
      internalLabel: audit.ownerName
        ? `Audit – ${audit.ownerName}`
        : 'Audit conversion',
    }

    if (debugConvertAudit) {
      console.log(
        '[ConvertAuditAPI] CreateRevenueProfile input:',
        createProfileInput
      )
    }

    const createProfilePayload = {
      query: CREATE_REVENUE_PROFILE,
      variables: { input: createProfileInput },
    }

    const createProfileResp = await fetch(appSyncConfig.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': appSyncConfig.apiKey,
      },
      body: JSON.stringify(createProfilePayload),
    })

    if (!createProfileResp.ok) {
      const text = await createProfileResp.text()
      console.error(
        '[ConvertAuditAPI] AppSync HTTP error (createRevenueProfile):',
        createProfileResp.status,
        createProfileResp.statusText,
        text
      )
      return res.status(502).json({
        ok: false,
        error: `AppSync request (createRevenueProfile) failed with status ${createProfileResp.status}`,
        details: text,
      })
    }

    const createProfileJson = (await createProfileResp.json()) as {
      data?: CreateRevenueProfileResponse
      errors?: any
    }

    if (createProfileJson.errors && createProfileJson.errors.length) {
      console.error(
        '[ConvertAuditAPI] AppSync GraphQL errors (createRevenueProfile):',
        createProfileJson.errors
      )
      return res.status(502).json({
        ok: false,
        error: 'AppSync GraphQL error while creating RevenueProfile',
        details: createProfileJson.errors,
      })
    }

    const createdProfile = createProfileJson.data?.createRevenueProfile ?? null
    if (!createdProfile) {
      console.warn(
        '[ConvertAuditAPI] createRevenueProfile returned null:',
        createProfileJson
      )
      // Not fatal for redirect, but we should warn
    } else {
      console.log(
        '[ConvertAuditAPI] Created RevenueProfile with id=',
        createdProfile.id
      )
    }

    // 4) Update the audit with the new propertyId
    const updateAuditInput = {
      id: audit.id,
      propertyId,
    }

    if (debugConvertAudit) {
      console.log(
        '[ConvertAuditAPI] UpdateRevenueAudit input:',
        updateAuditInput
      )
    }

    const updateAuditPayload = {
      query: UPDATE_REVENUE_AUDIT,
      variables: { input: updateAuditInput },
    }

    const updateAuditResp = await fetch(appSyncConfig.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': appSyncConfig.apiKey,
      },
      body: JSON.stringify(updateAuditPayload),
    })

    if (!updateAuditResp.ok) {
      const text = await updateAuditResp.text()
      console.error(
        '[ConvertAuditAPI] AppSync HTTP error (updateRevenueAudit):',
        updateAuditResp.status,
        updateAuditResp.statusText,
        text
      )
      return res.status(502).json({
        ok: false,
        error: `AppSync request (updateRevenueAudit) failed with status ${updateAuditResp.status}`,
        details: text,
      })
    }

    const updateAuditJson = (await updateAuditResp.json()) as {
      data?: UpdateRevenueAuditResponse
      errors?: any
    }

    if (updateAuditJson.errors && updateAuditJson.errors.length) {
      console.error(
        '[ConvertAuditAPI] AppSync GraphQL errors (updateRevenueAudit):',
        updateAuditJson.errors
      )
      return res.status(502).json({
        ok: false,
        error: 'AppSync GraphQL error while updating RevenueAudit',
        details: updateAuditJson.errors,
      })
    }

    const updatedAudit = updateAuditJson.data?.updateRevenueAudit ?? null
    if (!updatedAudit) {
      console.warn(
        '[ConvertAuditAPI] updateRevenueAudit returned null:',
        updateAuditJson
      )
    } else {
      console.log(
        '[ConvertAuditAPI] RevenueAudit updated with propertyId=',
        updatedAudit.propertyId
      )
    }

    // 5) Return propertyId so the admin UI can redirect
    return res.status(200).json({
      ok: true,
      auditId: audit.id,
      propertyId,
      alreadyLinked: false,
    })
  } catch (err) {
    console.error('[ConvertAuditAPI] Unexpected error:', err)
    return res.status(500).json({
      ok: false,
      error: 'Unexpected server error while converting audit to client.',
    })
  }
}

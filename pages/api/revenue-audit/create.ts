// pages/api/revenue-audit/create.ts
/* eslint-disable no-console */
import type { NextApiRequest, NextApiResponse } from 'next'

const APPSYNC_ENDPOINT = process.env.APPSYNC_GRAPHQL_ENDPOINT
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY

const debugRevenueAudit = process.env.DEBUG_REVENUE_AUDIT === '1'

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  if (!APPSYNC_ENDPOINT || !APPSYNC_API_KEY) {
    console.error(
      '[RevenueAuditAPI] Missing AppSync env. APPSYNC_GRAPHQL_ENDPOINT / APPSYNC_API_KEY must be set.'
    )
    return res.status(500).json({
      ok: false,
      error:
        'Server is not configured for AppSync. Missing APPSYNC_GRAPHQL_ENDPOINT or APPSYNC_API_KEY.',
    })
  }

  const body = req.body as CreateAuditInputBody
  if (debugRevenueAudit) {
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

  // Build an "intake snapshot" string we can later parse or just read
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

  // We keep revenue metrics null for now – those are filled in during the actual audit.
  const gqlInput: Record<string, any> = {
    owner: 'latimere-intake', // system owner for public audits; admin reads these
    ownerName: name,
    ownerEmail: email,
    listingUrl,
    marketName: market || null,
    // Use recommendations as a place to store intake details for now
    recommendations: intakeDetails || null,
    // Other fields (estimates) remain null until you complete the audit
  }

  if (debugRevenueAudit) {
    console.log('[RevenueAuditAPI] GraphQL input:', gqlInput)
  }

  try {
    const payload = {
      query: CREATE_REVENUE_AUDIT,
      variables: { input: gqlInput },
    }

    const response = await fetch(APPSYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': APPSYNC_API_KEY,
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

    if (debugRevenueAudit) {
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

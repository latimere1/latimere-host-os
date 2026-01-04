// pages/api/admin/referral-partners/create.ts
/* eslint-disable no-console */
import type { NextApiRequest, NextApiResponse } from 'next'
import { randomUUID } from 'crypto'

type CreatePartnerRequestBody = {
  name?: string
  type?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  referralCode?: string
}

type ReferralPartner = {
  id: string
  name: string
  type?: string | null
  referralCode: string
  active: boolean
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
}

type SuccessResponse = {
  ok: true
  partner: ReferralPartner
  link: string
}

type ErrorResponse = {
  ok: false
  error: string
}

/* -------------------------------------------------------------------------- */
/* Debug / logging flags                                                      */
/* -------------------------------------------------------------------------- */

const DEBUG_REFERRALS = process.env.DEBUG_REFERRAL_INVITES === '1'
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

function logDebug(reqId: string, msg: string, data?: unknown) {
  if (DEBUG_REFERRALS || LOG_LEVEL === 'debug') {
    console.log(`[admin/referral-partners/create][${reqId}] ${msg}`, data ?? '')
  }
}

function logInfo(reqId: string, msg: string, data?: unknown) {
  if (LOG_LEVEL === 'info' || LOG_LEVEL === 'debug') {
    console.log(`[admin/referral-partners/create][${reqId}] ${msg}`, data ?? '')
  }
}

function logError(reqId: string, msg: string, data?: unknown) {
  console.error(`[admin/referral-partners/create][${reqId}] ${msg}`, data ?? '')
}

/* -------------------------------------------------------------------------- */
/* AppSync helpers via NEXT_PUBLIC_AMPLIFY_JSON                               */
/* -------------------------------------------------------------------------- */

function getAppSyncConfig(reqId: string) {
  const raw = process.env.NEXT_PUBLIC_AMPLIFY_JSON
  if (!raw) {
    logError(reqId, 'NEXT_PUBLIC_AMPLIFY_JSON missing at runtime')
    throw new Error(
      'AppSync not configured – NEXT_PUBLIC_AMPLIFY_JSON is missing in runtime'
    )
  }

  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch (err: any) {
    logError(reqId, 'Failed to parse NEXT_PUBLIC_AMPLIFY_JSON', {
      message: err?.message,
    })
    throw new Error('AppSync not configured – invalid NEXT_PUBLIC_AMPLIFY_JSON')
  }

  const endpoint: string | undefined = parsed.aws_appsync_graphqlEndpoint
  const apiKey: string | undefined = parsed.aws_appsync_apiKey

  logDebug(reqId, 'Resolved AppSync config', {
    hasEndpoint: !!endpoint,
    hasApiKey: !!apiKey,
    endpointSample: endpoint?.slice(0, 60),
  })

  if (!endpoint || !apiKey) {
    throw new Error(
      'AppSync not configured – aws_appsync_graphqlEndpoint or aws_appsync_apiKey missing in NEXT_PUBLIC_AMPLIFY_JSON'
    )
  }

  return { endpoint, apiKey }
}

async function callAppSync<T>(
  reqId: string,
  query: string,
  variables: Record<string, any>
): Promise<T> {
  const { endpoint, apiKey } = getAppSyncConfig(reqId)

  logDebug(reqId, 'Calling AppSync', {
    endpointSample: endpoint.slice(0, 60),
    variablesPreview: Object.keys(variables || {}),
  })

  let resp: Response
  try {
    resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ query, variables }),
    })
  } catch (err: any) {
    logError(reqId, 'Network error talking to AppSync', {
      message: err?.message,
    })
    throw new Error(`AppSync network error: ${err?.message || 'fetch failed'}`)
  }

  const text = await resp.text()
  let json: any = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    logError(reqId, 'Failed to parse AppSync JSON', {
      status: resp.status,
      textSnippet: text.slice(0, 500),
    })
    throw new Error('Invalid JSON returned from AppSync')
  }

  if (!resp.ok || json.errors) {
    logError(reqId, 'AppSync GraphQL error', {
      status: resp.status,
      statusText: resp.statusText,
      errors: json.errors,
    })
    const firstMsg = json.errors?.[0]?.message
    throw new Error(
      firstMsg ||
        `AppSync error – HTTP ${resp.status} ${resp.statusText} (see logs)`
    )
  }

  return json.data as T
}

/* -------------------------------------------------------------------------- */
/* GraphQL for ReferralPartner                                                */
/* -------------------------------------------------------------------------- */

// Query used to check if a referralCode is already taken
const REFERRAL_PARTNER_BY_CODE = /* GraphQL */ `
  query ReferralPartnerByCode($referralCode: String!) {
    referralPartnerByCode(referralCode: $referralCode) {
      items {
        id
      }
    }
  }
`

// Mutation to create the partner
const CREATE_REFERRAL_PARTNER = /* GraphQL */ `
  mutation CreateReferralPartner($input: CreateReferralPartnerInput!) {
    createReferralPartner(input: $input) {
      id
      name
      type
      referralCode
      active
      contactName
      contactEmail
      contactPhone
    }
  }
`

async function referralCodeExists(reqId: string, code: string): Promise<boolean> {
  try {
    type QueryResp = {
      referralPartnerByCode: {
        items: { id: string }[]
      }
    }

    const data = await callAppSync<QueryResp>(reqId, REFERRAL_PARTNER_BY_CODE, {
      referralCode: code,
    })

    const items = data.referralPartnerByCode?.items ?? []
    const exists = items.length > 0

    logDebug(reqId, 'Checked referralCode uniqueness', {
      code,
      exists,
    })

    return exists
  } catch (err: any) {
    logError(reqId, 'Error checking referralCode uniqueness', {
      code,
      message: err?.message,
    })
    // On failure, assume not existing to avoid blocking create.
    return false
  }
}

/**
 * Generate a sane referralCode from user input.
 * - Use requested code if provided (uppercased, stripped)
 * - Otherwise derive from name
 * - On collision, append a 2-digit suffix
 */
async function generateReferralCode(
  reqId: string,
  name: string,
  requestedCode?: string | null
): Promise<string> {
  const baseFromRequested = (requestedCode || '').trim()
  const baseRaw = baseFromRequested || name || 'PARTNER'

  // Uppercase, remove non-alphanumerics, collapse spaces
  let base = baseRaw
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 16) || 'PARTNER'

  logDebug(reqId, 'Base referralCode candidate', { base, requestedCode })

  // First try base as-is
  if (!(await referralCodeExists(reqId, base))) {
    return base
  }

  // Try a few suffixed variants: BASE01, BASE02, ...
  for (let i = 1; i <= 9; i += 1) {
    const suffix = i.toString().padStart(2, '0')
    const candidate = `${base.slice(0, 16 - suffix.length)}${suffix}`
    if (!(await referralCodeExists(reqId, candidate))) {
      logInfo(reqId, 'Resolved unique referralCode with suffix', {
        base,
        candidate,
      })
      return candidate
    }
  }

  // Fallback: random suffix
  const randomSuffix = Math.floor(Math.random() * 900 + 100).toString()
  const fallback = `${base.slice(0, 16 - randomSuffix.length)}${randomSuffix}`
  logInfo(reqId, 'Resolved referralCode using random suffix fallback', {
    base,
    fallback,
  })
  return fallback
}

/* -------------------------------------------------------------------------- */
/* Handler                                                                    */
/* -------------------------------------------------------------------------- */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse | { error: string }>
) {
  const reqId = randomUUID().slice(0, 8)

  logInfo(reqId, 'Incoming request', {
    method: req.method,
    path: req.url,
    nodeEnv: process.env.NODE_ENV,
  })

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let body: CreatePartnerRequestBody = {}
  try {
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body)
    } else {
      body = (req.body || {}) as CreatePartnerRequestBody
    }
  } catch (err: any) {
    logError(reqId, 'Failed to parse JSON body', {
      message: err?.message,
    })
    return res.status(400).json({
      ok: false,
      error: 'Invalid JSON body',
    })
  }

  const {
    name,
    type,
    contactName,
    contactEmail,
    contactPhone,
    referralCode: requestedCode,
  } = body

  if (!name || !name.trim()) {
    logDebug(reqId, 'Validation failed – missing name', body)
    return res.status(400).json({
      ok: false,
      error: 'Partner name is required',
    })
  }

  const normalizedName = name.trim()
  const normalizedType = (type || 'business').trim().toLowerCase() || 'business'

  logDebug(reqId, 'Prepared createPartner payload (pre-code)', {
    name: normalizedName,
    type: normalizedType,
    contactName,
    contactEmail,
    contactPhone,
    requestedCode,
  })

  try {
    const referralCode = await generateReferralCode(
      reqId,
      normalizedName,
      requestedCode
    )

    const input: any = {
      name: normalizedName,
      type: normalizedType,
      referralCode,
      active: true,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
    }

    logDebug(reqId, 'Final createReferralPartner input', {
      inputPreview: {
        name: input.name,
        type: input.type,
        referralCode: input.referralCode,
        active: input.active,
      },
    })

    type CreateResp = {
      createReferralPartner: ReferralPartner
    }

    const data = await callAppSync<CreateResp>(
      reqId,
      CREATE_REFERRAL_PARTNER,
      { input }
    )

    const partner = data.createReferralPartner
    if (!partner) {
      throw new Error('Failed to create ReferralPartner – no data returned')
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://www.latimere.com')

    const link = `${siteUrl.replace(/\/+$/, '')}/refer?code=${encodeURIComponent(
      partner.referralCode
    )}`

    logInfo(reqId, 'ReferralPartner created successfully', {
      partnerId: partner.id,
      name: partner.name,
      referralCode: partner.referralCode,
      link,
    })

    return res.status(200).json({
      ok: true,
      partner,
      link,
    })
  } catch (err: any) {
    logError(reqId, 'Unexpected error in create partner handler', {
      message: err?.message,
      stack: err?.stack,
    })

    return res.status(500).json({
      ok: false,
      error:
        err?.message ||
        'Unexpected server error while creating referral partner (see server logs)',
    })
  }
}

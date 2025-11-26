// pages/api/admin/revenue/email-preview.ts
/* eslint-disable no-console */
import type { NextApiRequest, NextApiResponse } from 'next'

const debugRevenueEmail = process.env.DEBUG_REVENUE_EMAIL === '1'

type RevenueTier = 'ESSENTIAL' | 'PRO' | 'ELITE' | null

type RevenueProfile = {
  id: string
  tier: RevenueTier
  pricingCadence?: string | null
  isActive?: boolean | null
  baseNightlyRate?: number | null
  targetOccupancyPct?: number | null
  marketName?: string | null
}

type Property = {
  id: string
  name?: string | null
  nickname?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  revenueProfile?: RevenueProfile | null
}

type RevenueSnapshot = {
  id: string
  periodStart: string
  periodEnd: string
  label?: string | null
  grossRevenue?: number | null
  occupancyPct?: number | null
  adr?: number | null
  nightsBooked?: number | null
  nightsAvailable?: number | null
  marketOccupancyPct?: number | null
  marketAdr?: number | null
  future30Revenue?: number | null
  future60Revenue?: number | null
  future90Revenue?: number | null
  cleaningFeesCollected?: number | null
  cancellationsCount?: number | null
  cancellationRevenueLost?: number | null
  revenueReportUrl?: string | null
  dashboardUrl?: string | null
  keyInsights?: string | null
  pricingDecisionsSummary?: string | null
  property?: Property | null
}

type GetRevenueSnapshotResponse = {
  getRevenueSnapshot?: RevenueSnapshot | null
}

type ResolvedAppSyncConfig = {
  endpoint: string
  apiKey: string
  source: 'env' | 'amplifyJson'
}

const GET_REVENUE_SNAPSHOT_WITH_PROPERTY = /* GraphQL */ `
  query GetRevenueSnapshotWithProperty($id: ID!) {
    getRevenueSnapshot(id: $id) {
      id
      periodStart
      periodEnd
      label
      grossRevenue
      occupancyPct
      adr
      nightsBooked
      nightsAvailable
      marketOccupancyPct
      marketAdr
      future30Revenue
      future60Revenue
      future90Revenue
      cleaningFeesCollected
      cancellationsCount
      cancellationRevenueLost
      revenueReportUrl
      dashboardUrl
      keyInsights
      pricingDecisionsSummary
      property {
        id
        name
        nickname
        city
        state
        country
        revenueProfile {
          id
          tier
          pricingCadence
          isActive
          baseNightlyRate
          targetOccupancyPct
          marketName
        }
      }
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

function formatCurrency(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '$0'
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatPercent(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '0%'
  return `${value.toFixed(0)}%`
}

function formatMonthLabel(snapshot: RevenueSnapshot): string {
  if (snapshot.label) return snapshot.label
  if (!snapshot.periodStart) return 'this period'
  const d = new Date(snapshot.periodStart)
  if (Number.isNaN(d.getTime())) return snapshot.periodStart
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function tierDisplay(tier: RevenueTier): string {
  switch (tier) {
    case 'ESSENTIAL':
      return 'Essential'
    case 'PRO':
      return 'Pro'
    case 'ELITE':
      return 'Elite'
    default:
      return 'Latimere Revenue Management'
  }
}

function buildEmailSubject(snapshot: RevenueSnapshot, property: Property | null) {
  const monthLabel = formatMonthLabel(snapshot)
  const name = property?.nickname || property?.name || 'your property'
  return `Your ${monthLabel} revenue — ${name}`
}

function buildPreviewText(snapshot: RevenueSnapshot, property: Property | null) {
  const occ = formatPercent(snapshot.occupancyPct ?? 0)
  const adr = formatCurrency(snapshot.adr ?? 0)
  const name = property?.nickname || property?.name || 'your property'
  return `${name}: ${occ} occupancy at an average of ${adr}. See what Latimere changed and what’s next.`
}

/**
 * Build owner-facing HTML email.
 * Simple, inlined styles so it looks good in Gmail, Apple Mail, etc.
 */
function buildEmailHtml(snapshot: RevenueSnapshot, property: Property | null): string {
  const monthLabel = formatMonthLabel(snapshot)
  const propertyName = property?.nickname || property?.name || 'Your property'
  const location = [property?.city, property?.state, property?.country]
    .filter(Boolean)
    .join(', ')
  const revenue = formatCurrency(snapshot.grossRevenue ?? 0)
  const occupancy = formatPercent(snapshot.occupancyPct ?? 0)
  const adr = formatCurrency(snapshot.adr ?? 0)
  const nightsBooked = snapshot.nightsBooked ?? 0
  const nightsAvailable = snapshot.nightsAvailable ?? 0
  const occMarket = formatPercent(snapshot.marketOccupancyPct ?? 0)
  const adrMarket = formatCurrency(snapshot.marketAdr ?? 0)
  const f30 = formatCurrency(snapshot.future30Revenue ?? 0)
  const f60 = formatCurrency(snapshot.future60Revenue ?? 0)
  const f90 = formatCurrency(snapshot.future90Revenue ?? 0)
  const cleaningFees = formatCurrency(snapshot.cleaningFeesCollected ?? 0)
  const cancellationsCount = snapshot.cancellationsCount ?? 0
  const cancellationLost = formatCurrency(snapshot.cancellationRevenueLost ?? 0)
  const keyInsights =
    snapshot.keyInsights ||
    'Once we complete your first full month of optimization, we’ll share a plain-English summary of what changed and how it impacted your revenue.'
  const pricingSummary =
    snapshot.pricingDecisionsSummary ||
    'We adjusted your base rate, weekend premiums, minimum stays, and gap-night discounts based on demand, local events, and booking patterns.'

  const tier = property?.revenueProfile?.tier ?? null
  const tierName = tierDisplay(tier)

  const reportUrl = snapshot.revenueReportUrl || ''
  const dashboardUrl = snapshot.dashboardUrl || ''

  const hasLinks = Boolean(reportUrl || dashboardUrl)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charSet="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${monthLabel} Revenue — ${propertyName}</title>
</head>
<body style="margin:0;padding:0;background-color:#020617;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e7eb;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#020617;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;background-color:#020617;border-radius:16px;border:1px solid #1f2937;padding:24px;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom:16px;">
              <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#22d3ee;font-weight:600;">
                Latimere Revenue Management
              </div>
              <div style="font-size:22px;font-weight:600;color:#f9fafb;margin-top:4px;">
                ${propertyName} — ${monthLabel} results
              </div>
              ${location ? `<div style="font-size:13px;color:#9ca3af;margin-top:4px;">${location}</div>` : ''}
              <div style="font-size:12px;color:#9ca3af;margin-top:12px;">
                Below is a simple breakdown of how your property performed this month and how Latimere is tuning your pricing.
              </div>
            </td>
          </tr>

          <!-- Top metrics row -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;margin-top:4px;">
                <tr>
                  <!-- Revenue -->
                  <td style="width:33.33%;padding:12px;border-radius:12px;background-color:#020617;border:1px solid #1f2937;">
                    <div style="font-size:11px;color:#9ca3af;">Gross revenue</div>
                    <div style="font-size:20px;font-weight:600;color:#22d3ee;margin-top:4px;">${revenue}</div>
                    <div style="font-size:11px;color:#6b7280;margin-top:4px;">
                      Nights booked: ${nightsBooked}/${nightsAvailable || '—'}
                    </div>
                  </td>

                  <!-- Occupancy -->
                  <td style="width:33.33%;padding:12px;border-radius:12px;background-color:#020617;border:1px solid #1f2937;">
                    <div style="font-size:11px;color:#9ca3af;">Occupancy</div>
                    <div style="font-size:20px;font-weight:600;color:#e5e7eb;margin-top:4px;">${occupancy}</div>
                    <div style="font-size:11px;color:#6b7280;margin-top:4px;">
                      Market: ${occMarket}
                    </div>
                  </td>

                  <!-- ADR -->
                  <td style="width:33.33%;padding:12px;border-radius:12px;background-color:#020617;border:1px solid #1f2937;">
                    <div style="font-size:11px;color:#9ca3af;">Average nightly rate</div>
                    <div style="font-size:20px;font-weight:600;color:#e5e7eb;margin-top:4px;">${adr}</div>
                    <div style="font-size:11px;color:#6b7280;margin-top:4px;">
                      Market: ${adrMarket}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Forward 90 days -->
          <tr>
            <td style="padding-top:16px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:12px;background-color:#020617;border:1px solid #1f2937;padding:12px;">
                <tr>
                  <td>
                    <div style="font-size:13px;font-weight:600;color:#f9fafb;">Booking outlook — next 90 days</div>
                    <div style="font-size:11px;color:#9ca3af;margin-top:4px;">
                      Based on current bookings and our pricing strategy, here’s what the next few months look like.
                    </div>
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:8px;">
                      <tr>
                        <td style="padding-right:16px;">
                          <div style="font-size:11px;color:#9ca3af;">Next 30 days</div>
                          <div style="font-size:14px;font-weight:600;color:#e5e7eb;">${f30}</div>
                        </td>
                        <td style="padding-right:16px;">
                          <div style="font-size:11px;color:#9ca3af;">Next 60 days</div>
                          <div style="font-size:14px;font-weight:600;color:#e5e7eb;">${f60}</div>
                        </td>
                        <td>
                          <div style="font-size:11px;color:#9ca3af;">Next 90 days</div>
                          <div style="font-size:14px;font-weight:600;color:#e5e7eb;">${f90}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fees & cancellations -->
          <tr>
            <td style="padding-top:12px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:12px;background-color:#020617;border:1px solid #1f2937;padding:12px;">
                <tr>
                  <td>
                    <div style="font-size:13px;font-weight:600;color:#f9fafb;">Fees & cancellations</div>
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:8px;">
                      <tr>
                        <td style="padding-right:16px;">
                          <div style="font-size:11px;color:#9ca3af;">Cleaning fees collected</div>
                          <div style="font-size:13px;font-weight:500;color:#e5e7eb;">${cleaningFees}</div>
                        </td>
                        <td>
                          <div style="font-size:11px;color:#9ca3af;">Cancellations</div>
                          <div style="font-size:13px;font-weight:500;color:#e5e7eb;">
                            ${cancellationsCount} (${cancellationLost} lost)
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Narrative -->
          <tr>
            <td style="padding-top:16px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:12px;background-color:#020617;border:1px solid #1f2937;padding:12px;">
                <tr>
                  <td>
                    <div style="font-size:13px;font-weight:600;color:#f9fafb;">What this month tells us</div>
                    <div style="font-size:12px;color:#e5e7eb;margin-top:6px;line-height:1.5;">
                      ${keyInsights.replace(/\n/g, '<br />')}
                    </div>

                    <div style="font-size:13px;font-weight:600;color:#f9fafb;margin-top:14px;">
                      How Latimere adjusted your pricing
                    </div>
                    <div style="font-size:12px;color:#d1d5db;margin-top:6px;line-height:1.5;">
                      ${pricingSummary.replace(/\n/g, '<br />')}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Links -->
          ${
            hasLinks
              ? `
          <tr>
            <td style="padding-top:16px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:12px;background-color:#020617;border:1px solid #1f2937;padding:12px;text-align:center;">
                <tr>
                  <td>
                    <div style="font-size:13px;font-weight:600;color:#f9fafb;">Full details</div>
                    <div style="font-size:11px;color:#9ca3af;margin-top:4px;">
                      Use the links below if you’d like to drill into the full report or live dashboard.
                    </div>
                    ${
                      reportUrl
                        ? `
                    <div style="margin-top:10px;">
                      <a href="${reportUrl}" style="display:inline-block;padding:8px 16px;border-radius:9999px;background-color:#22d3ee;color:#020617;font-size:12px;font-weight:600;text-decoration:none;">
                        View full monthly report (PDF)
                      </a>
                    </div>
                    `
                        : ''
                    }
                    ${
                      dashboardUrl
                        ? `
                    <div style="margin-top:8px;">
                      <a href="${dashboardUrl}" style="display:inline-block;padding:8px 16px;border-radius:9999px;border:1px solid #4b5563;color:#e5e7eb;font-size:12px;text-decoration:none;">
                        Open live dashboard
                      </a>
                    </div>
                    `
                        : ''
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ''
          }

          <!-- Footer -->
          <tr>
            <td style="padding-top:18px;">
              <div style="font-size:11px;color:#6b7280;border-top:1px solid #111827;padding-top:12px;">
                You’re currently on the ${tierName} plan with Latimere. If you’d
                like us to be more aggressive with revenue, tighten minimum stays,
                or prepare for a new season, just reply to this email and we’ll
                adjust your strategy.
              </div>
            </td>
          </tr>
        </table>

        <div style="max-width:640px;font-size:10px;color:#4b5563;margin-top:8px;">
          © ${new Date().getFullYear()} Latimere. All rights reserved.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const routeLabel = 'RevenueEmail'

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

  const { revenueSnapshotId } = req.body as {
    revenueSnapshotId?: string
    ownerEmailOverride?: string
  }

  if (!revenueSnapshotId) {
    return res.status(400).json({
      ok: false,
      error: 'Missing required field: revenueSnapshotId',
    })
  }

  if (debugRevenueEmail) {
    console.log('[RevenueEmail] Incoming request body:', req.body)
    console.log('[RevenueEmail] Using AppSync config source:', appSyncConfig.source)
  }

  try {
    // Fetch snapshot + property via AppSync
    const payload = {
      query: GET_REVENUE_SNAPSHOT_WITH_PROPERTY,
      variables: { id: revenueSnapshotId },
    }

    if (debugRevenueEmail) {
      console.log('[RevenueEmail] Fetching snapshot from AppSync:', payload)
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
        '[RevenueEmail] AppSync HTTP error:',
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

    const json = (await response.json()) as {
      data?: GetRevenueSnapshotResponse
      errors?: any
    }

    if (json.errors && json.errors.length) {
      console.error('[RevenueEmail] AppSync GraphQL errors:', json.errors)
      return res.status(502).json({
        ok: false,
        error: 'AppSync GraphQL error',
        details: json.errors,
      })
    }

    const snapshot = json.data?.getRevenueSnapshot ?? null
    if (!snapshot) {
      console.warn(
        '[RevenueEmail] No snapshot found for id',
        revenueSnapshotId
      )
      return res
        .status(404)
        .json({ ok: false, error: 'RevenueSnapshot not found' })
    }

    const property = snapshot.property ?? null

    if (debugRevenueEmail) {
      console.log('[RevenueEmail] Loaded snapshot:', snapshot)
      console.log('[RevenueEmail] Loaded property:', property)
    }

    const subject = buildEmailSubject(snapshot, property)
    const previewText = buildPreviewText(snapshot, property)
    const html = buildEmailHtml(snapshot, property)

    return res.status(200).json({
      ok: true,
      subject,
      previewText,
      html,
    })
  } catch (err) {
    console.error('[RevenueEmail] Unexpected error:', err)
    return res.status(500).json({
      ok: false,
      error: 'Unexpected server error while generating email preview.',
    })
  }
}

// pages/api/admin/revenue/audit-email-preview.ts
/* eslint-disable no-console */
import type { NextApiRequest, NextApiResponse } from 'next'

const debugRevenueEmail =
  process.env.DEBUG_REVENUE_EMAIL === '1' ||
  process.env.DEBUG_REVENUE === '1'

type AuditItem = {
  id: string
  propertyId?: string | null

  ownerName?: string | null
  ownerEmail?: string | null
  listingUrl?: string | null
  marketName?: string | null

  estimatedAnnualRevenueCurrent?: number | null
  estimatedAnnualRevenueOptimized?: number | null
  projectedGainPct?: number | null

  underpricingIssues?: string | null
  competitorSummary?: string | null
  recommendations?: string | null

  createdAt?: string | null
  [key: string]: any
}

type PreviewRequestBody = {
  recipientName?: string | null
  recipientEmail?: string | null
  periodLabel?: string | null
  introNote?: string | null
  audits: AuditItem[]
}

type PreviewResponseBody =
  | {
      ok: true
      subject: string
      html: string
      text: string
    }
  | {
      ok: false
      error: string
    }

function formatCurrency(amount?: number | null): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return ''
  }
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function formatPct(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return ''
  return `${value.toFixed(1)}%`
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function listingLabel(a: AuditItem): string {
  const pieces = [
    a.marketName || '',
    a.listingUrl || '',
    a.ownerName ? `Owner: ${a.ownerName}` : '',
  ].filter(Boolean)
  if (pieces.length === 0) {
    return `Property ${a.propertyId || a.id}`
  }
  return pieces.join(' • ')
}

function buildSubject(body: PreviewRequestBody): string {
  const count = body.audits?.length ?? 0
  const baseLabel = body.periodLabel || 'Revenue optimization audit'
  const countLabel = count === 1 ? '1 listing' : `${count} listings`
  return `${baseLabel} – ${countLabel}`
}

function buildText(body: PreviewRequestBody): string {
  const { recipientName, periodLabel, introNote, audits } = body
  const lines: string[] = []

  if (recipientName) {
    lines.push(`Hi ${recipientName},`, '')
  } else {
    lines.push('Hi,', '')
  }

  if (periodLabel) {
    lines.push(`Here is your revenue optimization audit for ${periodLabel}.`, '')
  } else {
    lines.push('Here is your latest revenue optimization audit.', '')
  }

  if (introNote) {
    lines.push(introNote.trim(), '')
  }

  if (!audits || audits.length === 0) {
    lines.push('There are currently no optimization opportunities to report.', '')
    lines.push('Best,', 'Latimere Hosting')
    return lines.join('\n')
  }

  lines.push('Summary by listing:')
  lines.push('')

  audits.forEach((a, index) => {
    const idx = index + 1
    const label = listingLabel(a)
    const current = formatCurrency(a.estimatedAnnualRevenueCurrent)
    const optimized = formatCurrency(a.estimatedAnnualRevenueOptimized)
    const upliftPct = formatPct(a.projectedGainPct)
    const created = formatDate(a.createdAt)

    lines.push(`${idx}. ${label}`)
    if (current || optimized) {
      lines.push(`   Current:  ${current || 'n/a'}`)
      lines.push(`   Optimized: ${optimized || 'n/a'}`)
    }
    if (upliftPct) {
      lines.push(`   Projected uplift: ${upliftPct}`)
    }
    if (created) {
      lines.push(`   Audit date: ${created}`)
    }
    if (a.underpricingIssues) {
      lines.push(`   Underpricing: ${a.underpricingIssues}`)
    }
    if (a.competitorSummary) {
      lines.push(`   Competitors: ${a.competitorSummary}`)
    }
    if (a.recommendations) {
      lines.push(`   Recommendations: ${a.recommendations}`)
    }
    lines.push('')
  })

  lines.push('Best,', 'Latimere Hosting')

  return lines.join('\n')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildHtml(body: PreviewRequestBody): string {
  const { recipientName, periodLabel, introNote, audits } = body

  const headerLabel =
    periodLabel || 'Revenue optimization audit from Latimere Hosting'

  const introLines: string[] = []

  if (recipientName) {
    introLines.push(`Hi ${escapeHtml(recipientName)},`)
  } else {
    introLines.push('Hi,')
  }

  if (periodLabel) {
    introLines.push(
      `Here is your revenue optimization audit for <strong>${escapeHtml(
        periodLabel,
      )}</strong>.`,
    )
  } else {
    introLines.push('Here is your latest revenue optimization audit.')
  }

  if (introNote) {
    introLines.push(escapeHtml(introNote))
  }

  let auditsTable = ''

  if (!audits || audits.length === 0) {
    auditsTable = `<p>There are currently no optimization opportunities to report.</p>`
  } else {
    const rows = audits
      .map((a) => {
        const label = listingLabel(a)
        const current = formatCurrency(a.estimatedAnnualRevenueCurrent) || 'n/a'
        const optimized =
          formatCurrency(a.estimatedAnnualRevenueOptimized) || 'n/a'
        const uplift = formatPct(a.projectedGainPct) || 'n/a'
        const created = formatDate(a.createdAt) || ''
        const underpricing = a.underpricingIssues || ''
        const competitors = a.competitorSummary || ''
        const recs = a.recommendations || ''

        return `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; vertical-align: top;">
              ${escapeHtml(label)}
              ${
                created
                  ? `<div style="color:#666;font-size:12px;margin-top:2px;">Audit date: ${escapeHtml(
                      created,
                    )}</div>`
                  : ''
              }
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align:right; white-space:nowrap;">
              <div>Current: ${escapeHtml(current)}</div>
              <div>Optimized: ${escapeHtml(optimized)}</div>
              <div style="color:#16a34a;font-weight:500;margin-top:4px;">Uplift: ${escapeHtml(
                uplift,
              )}</div>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; font-size:12px;">
              ${
                underpricing
                  ? `<div><strong>Underpricing</strong><br/>${escapeHtml(
                      underpricing,
                    )}</div>`
                  : ''
              }
              ${
                competitors
                  ? `<div style="margin-top:6px;"><strong>Competitors</strong><br/>${escapeHtml(
                      competitors,
                    )}</div>`
                  : ''
              }
              ${
                recs
                  ? `<div style="margin-top:6px;"><strong>Recommendations</strong><br/>${escapeHtml(
                      recs,
                    )}</div>`
                  : ''
              }
            </td>
          </tr>
        `
      })
      .join('')

    auditsTable = `
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;max-width:900px;margin-top:16px;">
        <thead>
          <tr>
            <th style="padding: 8px; border: 1px solid #ddd; text-align:left;">Listing</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align:right;">Revenue</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align:left;">Details</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `
  }

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(headerLabel)}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111; background-color: #f5f5f5; padding: 16px;">
    <div style="max-width: 900px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 20px; border: 1px solid #e0e0e0;">
      <h1 style="font-size: 18px; margin: 0 0 12px 0;">${escapeHtml(
        headerLabel,
      )}</h1>
      <p>${introLines.join('<br/>')}</p>
      ${auditsTable}
      <p style="margin-top: 24px;">Best,<br/>Latimere Hosting</p>
    </div>
  </body>
</html>
  `.trim()
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PreviewResponseBody>,
) {
  const requestId = `audit-preview-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`

  if (req.method !== 'POST') {
    if (debugRevenueEmail) {
      console.warn(
        `[${requestId}] audit-email-preview: received non-POST method ${req.method}`,
      )
    }

    res.setHeader('Allow', 'POST')
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed. Use POST.',
    })
  }

  try {
    const body = req.body as PreviewRequestBody | undefined

    if (!body || !Array.isArray(body.audits)) {
      if (debugRevenueEmail) {
        console.error(
          `[${requestId}] audit-email-preview: invalid body`,
          JSON.stringify(body),
        )
      }
      return res.status(400).json({
        ok: false,
        error: 'Invalid request body. Expected { audits: AuditItem[] }.',
      })
    }

    if (debugRevenueEmail) {
      console.log(
        `[${requestId}] audit-email-preview: generating preview for ${body.audits.length} audits (period="${body.periodLabel || ''}")`,
      )
    }

    const subject = buildSubject(body)
    const text = buildText(body)
    const html = buildHtml(body)

    if (debugRevenueEmail) {
      console.log(
        `[${requestId}] audit-email-preview: generated subject="${subject}" (text length=${text.length}, html length=${html.length})`,
      )
    }

    return res.status(200).json({
      ok: true,
      subject,
      text,
      html,
    })
  } catch (err) {
    console.error(
      `[${requestId}] audit-email-preview: unexpected error`,
      err,
    )

    return res.status(500).json({
      ok: false,
      error: 'Failed to build audit email preview.',
    })
  }
}

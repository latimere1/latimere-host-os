// pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'

// NOTE: DynamoDB is lazy-loaded only if LEADS_DDB_TABLE is set (no hard dep).

type Body = {
  name?: string
  phone?: string
  email?: string
  topic?: string
  // optional lead typing from the parent page form
  service?: 'airbnb' | 'turo'
  airbnb?: { address?: string; listedBefore?: 'yes' | 'no' | ''; squareFootage?: string; sleeps?: string }
  turo?: { make?: string; model?: string; year?: string; location?: string }
}

type Resp = { ok: boolean; error?: string; mocked?: boolean; leadId?: string; dev?: any }

export default async function handler(req: NextApiRequest, res: NextApiResponse<Resp>) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' })

  const env = {
    region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION,
    from: process.env.SES_FROM,
    to: process.env.SES_TO,
    emailFeature: envBool(process.env.EMAIL_FEATURE_ENABLED, true),
    ddbTable: process.env.LEADS_DDB_TABLE || '',
    profile: process.env.AWS_PROFILE,
    loadCfg: process.env.AWS_SDK_LOAD_CONFIG,
    logLevel: (process.env.LOG_LEVEL || 'info').toLowerCase(),
  }

  const meta = {
    ip:
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.socket?.remoteAddress ?? ''),
    ua: req.headers['user-agent'] || '',
    referer: (req.headers['referer'] as string) || '',
    path: req.url || '',
  }

  log('info', '[/api/contact] start', {
    method: req.method,
    hasRegion: !!env.region,
    hasFrom: !!env.from,
    hasTo: !!env.to,
    emailFeature: env.emailFeature,
    ddbTable: !!env.ddbTable,
    profile: env.profile,
    loadCfg: env.loadCfg,
    meta,
  })

  // -------- Validate input
  const raw = (req.body ?? {}) as Body
  const {
    name = '',
    phone = '',
    email = '',
    service,
  } = raw

  // Derive topic if not provided
  const topic =
    raw.topic ||
    (service === 'airbnb'
      ? 'Airbnb Management Lead'
      : service === 'turo'
      ? 'Turo Management Lead'
      : 'Demo Request')

  if (!name || !email) {
    log('warn', '[/api/contact] missing required fields', { nameLen: name.length, emailLen: email.length })
    return res.status(400).json({ ok: false, error: 'Name and email are required.' })
  }

  // -------- Optional: persist to DynamoDB (non-blocking)
  let leadId = ''
  if (env.ddbTable) {
    try {
      const { DynamoDBClient, PutItemCommand } = await import('@aws-sdk/client-dynamodb')
      leadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const ddb = new DynamoDBClient({ region: env.region })
      await ddb.send(
        new PutItemCommand({
          TableName: env.ddbTable,
          Item: {
            id: { S: leadId },
            createdAt: { S: new Date().toISOString() },
            topic: { S: topic },
            service: { S: (service || 'unknown') as string },
            name: { S: name },
            email: { S: email },
            phone: { S: phone },
            source: { S: 'latimere-web' },
            meta_ip: { S: meta.ip },
            meta_ua: { S: meta.ua },
            meta_ref: { S: meta.referer },
            extra: { S: JSON.stringify(stripLarge(raw), null, 0) },
          },
        })
      )
      log('info', '[/api/contact] lead stored to DDB', { table: env.ddbTable, leadId })
    } catch (e: any) {
      log('error', '[/api/contact] DDB write failed (non-blocking)', errShape(e))
    }
  }

  // -------- Mock mode to keep you unblocked if SES is off
  if (!env.emailFeature) {
    log('info', '[/api/contact] EMAIL_FEATURE_ENABLED=false → mock success', {
      name,
      email,
      phone,
      topic,
      service,
      leadId,
    })
    return res.status(200).json({ ok: true, mocked: true, leadId })
  }

  // -------- Config checks
  if (!env.region || !env.from || !env.to) {
    log('error', '[/api/contact] missing SES configuration', {
      hasRegion: !!env.region,
      hasFrom: !!env.from,
      hasTo: !!env.to,
    })
    return res.status(500).json({ ok: false, error: 'Server not configured for email.' })
  }

  // -------- Identity sanity check (great signal if creds/profile/region are wrong)
  try {
    const sts = new STSClient({ region: env.region })
    const id = await sts.send(new GetCallerIdentityCommand({}))
    log('info', '[/api/contact] AWS identity', { account: id.Account, userId: id.UserId, arn: id.Arn })
  } catch (e: any) {
    log('error', '[/api/contact] STS failed (likely creds/profile/region issue)', errShape(e))
    // continue; SES *may* still work if env vars are set differently
  }

  // -------- Compose email (include all extra fields neatly)
  const { html, text, subject } = buildEmail({
    topic,
    name,
    email,
    phone,
    raw,
    meta,
  })

  try {
    const ses = new SESv2Client({ region: env.region })
    log('info', '[/api/contact] sending via SES', {
      to: env.to,
      from: env.from,
      subject,
      nameLen: name.length,
      phoneLen: phone.length,
      emailLen: email.length,
    })

    const out = await ses.send(
      new SendEmailCommand({
        FromEmailAddress: env.from!,
        Destination: { ToAddresses: [env.to!] },
        Content: { Simple: { Subject: { Data: subject }, Body: { Text: { Data: text }, Html: { Data: html } } } },
        ReplyToAddresses: [email],
      })
    )

    log('info', '✅ [/api/contact] SES sent', { messageId: (out as any)?.MessageId, meta: (out as any)?.$metadata })
    return res.status(200).json({ ok: true, leadId })
  } catch (e: any) {
    log('error', '❌ [/api/contact] SES error', errShape(e))
    const payload: Resp = { ok: false, error: 'Email failed to send.' }
    if (process.env.NODE_ENV !== 'production') {
      payload.dev = { name: e?.name, message: e?.message, code: e?.$metadata?.httpStatusCode }
    }
    return res.status(500).json(payload)
  }
}

/* ------------------------- helpers ------------------------- */

function buildEmail({
  topic,
  name,
  email,
  phone,
  raw,
  meta,
}: {
  topic: string
  name: string
  email: string
  phone: string
  raw: Record<string, any>
  meta: { ip: string; ua: string; referer: string; path: string }
}) {
  // Pull off known fields; everything else becomes "Details"
  const extras: Record<string, any> = { ...raw }
  delete extras.name
  delete extras.phone
  delete extras.email
  delete extras.topic

  const extrasText = prettyExtras(extras)
  const extrasHtml = extrasText
    ? `<h3 style="margin-top:16px;margin-bottom:8px;">Details</h3><pre style="white-space:pre-wrap;font-family:ui-monospace,Menlo,Consolas,monospace;background:#0b0f19;color:#e5e7eb;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.12)">${escapeHtml(
        extrasText
      )}</pre>`
    : ''

  const subject = `Latimere: ${topic}`

  const html =
    `<h2>${escapeHtml(topic)}</h2>
     <p><strong>Name:</strong> ${escapeHtml(name)}</p>
     <p><strong>Email:</strong> ${escapeHtml(email)}</p>
     <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
     ${extrasHtml}
     <hr style="border:none;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0;" />
     <p style="font-size:12px;color:#9aa2b1;">IP: ${escapeHtml(meta.ip)} • UA: ${escapeHtml(
      meta.ua
    )}<br/>Ref: ${escapeHtml(meta.referer)} • Path: ${escapeHtml(meta.path)}</p>
     <p style="margin-top:8px">Sent from Latimere website.</p>`

  const text =
    `${topic}\n\n` +
    `Name: ${name}\n` +
    `Email: ${email}\n` +
    `Phone: ${phone}\n` +
    (extrasText ? `\nDetails\n-------\n${extrasText}\n` : '') +
    `\nIP: ${meta.ip}\nUA: ${meta.ua}\nRef: ${meta.referer}\nPath: ${meta.path}\n` +
    `\nSent from Latimere website.\n`

  return { html, text, subject }
}

function prettyExtras(obj: any): string {
  if (!obj || typeof obj !== 'object') return ''
  const lines: string[] = []
  const walk = (o: any, prefix = '') => {
    for (const [k, v] of Object.entries(o)) {
      const key = prefix ? `${prefix}.${k}` : k
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        walk(v, key)
      } else {
        lines.push(`${key}: ${String(v ?? '')}`)
      }
    }
  }
  walk(obj)
  return lines.join('\n')
}

function stripLarge(v: unknown) {
  // Avoid huge payloads in DDB item
  try {
    const s = JSON.stringify(v)
    return s.length > 6000 ? { truncated: true } : JSON.parse(s)
  } catch {
    return { invalid: true }
  }
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]!))
}
function envBool(v: string | undefined | null, dflt = false) {
  if (v == null) return dflt
  const t = String(v).trim().toLowerCase()
  return t === '1' || t === 'true' || t === 'yes' || t === 'on'
}
function errShape(e: any) {
  return {
    name: e?.name,
    message: e?.message,
    code: e?.$metadata?.httpStatusCode ?? e?.code,
    meta: e?.$metadata,
    stack: e?.stack,
  }
}
function log(level: 'debug' | 'info' | 'warn' | 'error', msg: string, obj?: Record<string, unknown>) {
  const entry = { t: new Date().toISOString(), level, msg, ...(obj || {}) }
  if (level === 'error') console.error(entry)
  else if (level === 'warn') console.warn(entry)
  else if (level === 'debug') console.debug(entry)
  else console.log(entry)
}

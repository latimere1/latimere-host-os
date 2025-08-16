// pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'

type Body = {
  name?: string
  phone?: string
  email?: string
  topic?: string
  service?: 'airbnb' | 'turo'
  airbnb?: { address?: string; listedBefore?: 'yes' | 'no' | ''; squareFootage?: string; sleeps?: string }
  turo?: { make?: string; model?: string; year?: string; location?: string }
  message?: string
}

type Resp = {
  ok: boolean
  error?: string
  mocked?: boolean
  leadId?: string
  dev?: any
  requestId?: string
}

/* ---------------------- tiny utils ---------------------- */
const envBool = (v?: string | null, dflt = false) => {
  if (v == null) return dflt
  const t = String(v).trim().toLowerCase()
  return t === '1' || t === 'true' || t === 'yes' || t === 'on'
}
const mask = (v?: string | null) => (v ? v.replace(/.(?=.{3})/g, '•') : null)
const errShape = (e: any) => ({
  name: e?.name,
  message: e?.message,
  code: e?.$metadata?.httpStatusCode ?? e?.code,
  meta: e?.$metadata,
  stack: e?.stack,
})
const log = (level: 'debug' | 'info' | 'warn' | 'error', msg: string, obj?: Record<string, unknown>) => {
  const entry = { t: new Date().toISOString(), level, msg, ...(obj || {}) }
  if (level === 'error') console.error(entry)
  else if (level === 'warn') console.warn(entry)
  else if (level === 'debug') console.debug(entry)
  else console.log(entry)
}

/* ---------------------- config helpers ---------------------- */

const DEFAULTS = {
  region: 'us-east-1',
  // These are OK to expose publicly; they are not secrets.
  from: 'taylor@latimere.com',
  to: 'taylor@latimere.com',
}

type Picked = { value: string; source: string } | { value: ''; source: '' }

function pickEnv(...pairs: Array<[string, string | undefined | null]>): Picked {
  for (const [source, val] of pairs) {
    if (val != null && String(val).trim() !== '') return { value: String(val).trim(), source }
  }
  return { value: '', source: '' }
}

/* ---------------------- route ---------------------- */

export default async function handler(req: NextApiRequest, res: NextApiResponse<Resp | any>) {
  const requestId =
    (req.headers['x-request-id'] as string) ||
    (req.headers['x-amzn-trace-id'] as string) ||
    `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

  // Allow quick diagnostics without POSTing a body
  if (req.method !== 'POST') {
    if (req.method === 'GET' && (req.query.dbg === '1' || req.query.debug === '1')) {
      return res.status(200).json(debugSnapshot(requestId))
    }
    return res.status(405).json({ ok: false, error: 'Method Not Allowed', requestId })
  }

  // --- Resolve config with robust fallbacks ---
  // Region: SES_REGION → AWS_REGION → NEXT_PUBLIC_AWS_REGION → default
  const regionPick = pickEnv(
    ['SES_REGION', process.env.SES_REGION],
    ['AWS_REGION', process.env.AWS_REGION],
    ['NEXT_PUBLIC_AWS_REGION', process.env.NEXT_PUBLIC_AWS_REGION],
    ['DEFAULT', DEFAULTS.region]
  )

  // From/To: SES_* → EMAIL_* → NEXT_PUBLIC_SES_* → (prod default) → ''
  const fromPick = pickEnv(
    ['SES_FROM', process.env.SES_FROM],
    ['EMAIL_FROM', process.env.EMAIL_FROM],
    ['NEXT_PUBLIC_SES_FROM', process.env.NEXT_PUBLIC_SES_FROM],
    ['PROD_DEFAULT', process.env.NODE_ENV === 'production' ? DEFAULTS.from : '']
  )
  const toPick = pickEnv(
    ['SES_TO', process.env.SES_TO],
    ['EMAIL_TO', process.env.EMAIL_TO],
    ['NEXT_PUBLIC_SES_TO', process.env.NEXT_PUBLIC_SES_TO],
    ['PROD_DEFAULT', process.env.NODE_ENV === 'production' ? DEFAULTS.to : '']
  )

  // Email feature flag: default ON (especially in prod) unless explicitly disabled
  const rawEmailEnabled =
    process.env.EMAIL_FEATURE_ENABLED ??
    process.env.NEXT_PUBLIC_EMAIL_FEATURE_ENABLED ??
    (process.env.NODE_ENV === 'production' ? 'true' : 'true')
  const emailEnabled = envBool(rawEmailEnabled, true)

  const env = {
    region: regionPick.value,
    from: fromPick.value,
    to: toPick.value,
    fromSource: fromPick.source,
    toSource: toPick.source,
    regionSource: regionPick.source,
    cc: (process.env.SES_CC || '').split(',').map((s) => s.trim()).filter(Boolean),
    bcc: (process.env.SES_BCC || '').split(',').map((s) => s.trim()).filter(Boolean),
    cfgSet: process.env.SES_CONFIGURATION_SET || '',
    emailFeature: emailEnabled,
    ddbTable: process.env.LEADS_DDB_TABLE || '',
    logLevel: (process.env.LOG_LEVEL || 'info').toLowerCase(),
  }

  const meta = {
    ip:
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.socket?.remoteAddress ?? ''),
    ua: req.headers['user-agent'] || '',
    referer: (req.headers['referer'] as string) || '',
    path: req.url || '',
    requestId,
  }

  // Optional debug via POST (?dbg=1) so we can inspect same request
  if (req.query.dbg === '1' || req.query.debug === '1') {
    return res.status(200).json(debugSnapshot(requestId, env))
  }

  log('info', '[/api/contact] start', {
    requestId,
    envSummary: {
      hasRegion: !!env.region,
      hasFrom: !!env.from,
      hasTo: !!env.to,
      emailFeature: env.emailFeature,
      ddbTable: !!env.ddbTable,
      cfgSet: !!env.cfgSet,
      cc: env.cc.length,
      bcc: env.bcc.length,
      sources: { region: env.regionSource, from: env.fromSource, to: env.toSource },
    },
  })

  // --- Parse and validate body ---
  const raw = (req.body ?? {}) as Body
  const name = (raw.name || '').trim()
  const email = (raw.email || '').trim()
  const phone = (raw.phone || '').trim()
  const service = raw.service
  const topic =
    raw.topic ||
    (service === 'airbnb'
      ? 'Airbnb Management Lead'
      : service === 'turo'
      ? 'Turo Management Lead'
      : 'Demo Request')

  if (!name || !email) {
    log('warn', 'missing required fields', { requestId, nameLen: name.length, emailLen: email.length })
    return res.status(400).json({ ok: false, error: 'Name and email are required.', requestId })
  }

  // --- Optional DDB persist (non-blocking) ---
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
      log('info', 'lead stored to DDB', { requestId, table: env.ddbTable, leadId })
    } catch (e: any) {
      log('error', 'DDB write failed (non-blocking)', { requestId, ...errShape(e) })
    }
  }

  // --- Mock mode (feature flag off) ---
  if (!env.emailFeature) {
    log('info', 'EMAIL_FEATURE_ENABLED=false → mock success', {
      requestId, name, email, phone, topic, service, leadId,
    })
    return res.status(200).json({ ok: true, mocked: true, leadId, requestId })
  }

  // --- Config guard ---
  if (!env.region || !env.from || !env.to) {
    log('error', 'missing SES configuration', {
      requestId,
      hasRegion: !!env.region,
      hasFrom: !!env.from,
      hasTo: !!env.to,
      sources: { region: env.regionSource, from: env.fromSource, to: env.toSource },
      snapshot: { region: env.region, from: mask(env.from), to: mask(env.to) },
    })
    return res.status(500).json({ ok: false, error: 'Server not configured for email.', requestId })
  }

  // --- AWS identity sanity check (non-fatal) ---
  try {
    const sts = new STSClient({ region: env.region })
    const id = await sts.send(new GetCallerIdentityCommand({}))
    log('info', 'AWS identity', { requestId, account: id.Account, userId: id.UserId, arn: id.Arn })
  } catch (e: any) {
    log('warn', 'STS identity check failed (non-fatal)', { requestId, ...errShape(e) })
  }

  // --- Compose email ---
  const { html, text, subject } = buildEmail({ topic, name, email, phone, raw, meta })

  // --- Send via SES ---
  try {
    const ses = new SESv2Client({ region: env.region })
    log('info', 'sending via SES', {
      requestId,
      to: mask(env.to),
      from: mask(env.from),
      subject,
      cfgSet: env.cfgSet || '(none)',
      cc: env.cc.length,
      bcc: env.bcc.length,
    })

    const out = await ses.send(
      new SendEmailCommand({
        FromEmailAddress: env.from!,
        Destination: {
          ToAddresses: [env.to!],
          ...(env.cc.length ? { CcAddresses: env.cc } : {}),
          ...(env.bcc.length ? { BccAddresses: env.bcc } : {}),
        },
        Content: {
          Simple: {
            Subject: { Data: subject },
            Body: { Html: { Data: html }, Text: { Data: text } },
          },
        },
        ReplyToAddresses: [email],
        ...(env.cfgSet ? { ConfigurationSetName: env.cfgSet } : {}),
      })
    )

    log('info', '✅ SES sent', { requestId, messageId: (out as any)?.MessageId, meta: (out as any)?.$metadata })
    return res.status(200).json({ ok: true, leadId, requestId })
  } catch (e: any) {
    log('error', '❌ SES error', { requestId, ...errShape(e) })
    const payload: Resp = { ok: false, error: 'Email failed to send.', requestId }
    if (process.env.NODE_ENV !== 'production') {
      payload.dev = { name: e?.name, message: e?.message, code: e?.$metadata?.httpStatusCode, meta: e?.$metadata }
    }
    return res.status(500).json(payload)
  }
}

/* ---------------------- email helpers ---------------------- */

function buildEmail({
  topic, name, email, phone, raw, meta,
}: {
  topic: string
  name: string
  email: string
  phone: string
  raw: Record<string, any>
  meta: { ip: string; ua: string; referer: string; path: string; requestId: string }
}) {
  const extras: Record<string, any> = { ...raw }
  delete extras.name; delete extras.phone; delete extras.email; delete extras.topic

  const extrasText = prettyExtras(extras)
  const extrasHtml = extrasText
    ? `<h3 style="margin:16px 0 8px">Details</h3><pre style="white-space:pre-wrap;font-family:ui-monospace,Menlo,Consolas,monospace;background:#0b0f19;color:#e5e7eb;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.12)">${escapeHtml(extrasText)}</pre>`
    : ''

  const subject = `Latimere: ${topic}`
  const html =
    `<h2>${escapeHtml(topic)}</h2>
     <p><strong>Name:</strong> ${escapeHtml(name)}</p>
     <p><strong>Email:</strong> ${escapeHtml(email)}</p>
     <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
     ${extrasHtml}
     <hr style="border:none;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0" />
     <p style="font-size:12px;color:#9aa2b1;">IP: ${escapeHtml(meta.ip)} • UA: ${escapeHtml(meta.ua)}<br/>Ref: ${escapeHtml(meta.referer)} • Path: ${escapeHtml(meta.path)}<br/>RequestId: ${escapeHtml(meta.requestId)}</p>
     <p style="margin-top:8px">Sent from Latimere website.</p>`

  const text =
    `${topic}\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n` +
    (extrasText ? `\nDetails\n-------\n${extrasText}\n` : '') +
    `\nIP: ${meta.ip}\nUA: ${meta.ua}\nRef: ${meta.referer}\nPath: ${meta.path}\nRequestId: ${meta.requestId}\n\nSent from Latimere website.\n`

  return { html, text, subject }
}

function prettyExtras(obj: any): string {
  if (!obj || typeof obj !== 'object') return ''
  const lines: string[] = []
  const walk = (o: any, prefix = '') => {
    for (const [k, v] of Object.entries(o)) {
      const key = prefix ? `${prefix}.${k}` : k
      if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, key)
      else lines.push(`${key}: ${String(v ?? '')}`)
    }
  }
  walk(obj)
  return lines.join('\n')
}

function stripLarge(v: unknown) {
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

/* ---------------------- dbg snapshot ---------------------- */

function debugSnapshot(requestId: string, envIn?: any) {
  const env = envIn || {
    region:
      process.env.SES_REGION ||
      process.env.AWS_REGION ||
      process.env.NEXT_PUBLIC_AWS_REGION ||
      null,
    from:
      process.env.SES_FROM ||
      process.env.EMAIL_FROM ||
      process.env.NEXT_PUBLIC_SES_FROM ||
      null,
    to:
      process.env.SES_TO ||
      process.env.EMAIL_TO ||
      process.env.NEXT_PUBLIC_SES_TO ||
      null,
    emailFeature:
      process.env.EMAIL_FEATURE_ENABLED ??
      process.env.NEXT_PUBLIC_EMAIL_FEATURE_ENABLED ??
      null,
  }

  return {
    ok: true,
    requestId,
    has: {
      SES_FROM: !!process.env.SES_FROM,
      SES_TO: !!process.env.SES_TO,
      SES_REGION: !!process.env.SES_REGION,
      AWS_REGION: !!process.env.AWS_REGION,
      NEXT_PUBLIC_AWS_REGION: !!process.env.NEXT_PUBLIC_AWS_REGION,
      EMAIL_FEATURE_ENABLED: !!process.env.EMAIL_FEATURE_ENABLED,
      EMAIL_FROM: !!process.env.EMAIL_FROM,
      EMAIL_TO: !!process.env.EMAIL_TO,
      NEXT_PUBLIC_SES_FROM: !!process.env.NEXT_PUBLIC_SES_FROM,
      NEXT_PUBLIC_SES_TO: !!process.env.NEXT_PUBLIC_SES_TO,
    },
    values: {
      region: env.region,
      from: mask(env.from),
      to: mask(env.to),
      emailFeature: env.emailFeature,
    },
    sources: {
      region: process.env.SES_REGION
        ? 'SES_REGION'
        : process.env.AWS_REGION
        ? 'AWS_REGION'
        : process.env.NEXT_PUBLIC_AWS_REGION
        ? 'NEXT_PUBLIC_AWS_REGION'
        : 'DEFAULT',
      from: process.env.SES_FROM
        ? 'SES_FROM'
        : process.env.EMAIL_FROM
        ? 'EMAIL_FROM'
        : process.env.NEXT_PUBLIC_SES_FROM
        ? 'NEXT_PUBLIC_SES_FROM'
        : '(none)',
      to: process.env.SES_TO
        ? 'SES_TO'
        : process.env.EMAIL_TO
        ? 'EMAIL_TO'
        : process.env.NEXT_PUBLIC_SES_TO
        ? 'NEXT_PUBLIC_SES_TO'
        : '(none)',
    },
    hint: 'If SES_* are false in prod, set them under App settings → Environment variables (branch) OR add NEXT_PUBLIC_SES_* as fallback and redeploy.',
  }
}

/** Next.js API config (keep payloads modest) */
export const config = { api: { bodyParser: { sizeLimit: '64kb' } } }

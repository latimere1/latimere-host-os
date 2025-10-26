// pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'

/**
 * Response shape
 */
type ApiResp = {
  ok: boolean
  error?: string
  mocked?: boolean
  leadId?: string
  requestId?: string
  dev?: any
}

/**
 * Request body shape (backward compatible with prior Turo/Host OS payloads)
 */
type Body = {
  name?: string
  phone?: string
  email?: string
  topic?: string
  service?: 'airbnb' | 'turo' | string
  airbnb?: { address?: string; listedBefore?: 'yes' | 'no' | ''; squareFootage?: string; sleeps?: string }
  turo?: { make?: string; model?: string; year?: string; location?: string }
  message?: string
}

/* ────────────────────────── utils ────────────────────────── */

const nowIso = () => new Date().toISOString()

const envBool = (v?: string | null, dflt = false) => {
  if (v == null) return dflt
  const t = String(v).trim().toLowerCase()
  return t === '1' || t === 'true' || t === 'yes' || t === 'on'
}

const mask = (v?: string | null) => (v ? v.replace(/.(?=.{3})/g, '•') : v)

const errShape = (e: any) => ({
  name: e?.name,
  message: e?.message,
  code: e?.$metadata?.httpStatusCode ?? e?.code,
  meta: e?.$metadata,
  stack: process.env.NODE_ENV === 'production' ? undefined : e?.stack,
})

function pickEnv(...pairs: Array<[string, string | undefined | null]>) {
  for (const [source, val] of pairs) {
    const v = (val ?? '').toString().trim()
    if (v) return { value: v, source }
  }
  return { value: '', source: '' }
}

const pretty = (obj: unknown) => {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

const log = (level: 'debug' | 'info' | 'warn' | 'error', msg: string, extra?: Record<string, unknown>) => {
  const entry = { t: nowIso(), level, msg, ...(extra || {}) }
  if (level === 'error') console.error(entry)
  else if (level === 'warn') console.warn(entry)
  else if (level === 'debug') console.debug(entry)
  else console.info(entry)
}

/* ─────────────────────── config + modes ───────────────────────
   Delivery Mode:
   - "mock": log and 200 OK (default in development)
   - "ses": send email via SES (default in production if configured)
   You can override with CONTACT_DELIVERY_MODE=mock|ses
----------------------------------------------------------------- */
type EnvShape = {
  region: string
  from: string
  to: string
  cc: string[]
  bcc: string[]
  cfgSet: string
  emailEnabled: boolean
  ddbTable: string
  logLevel: string
  mode: 'mock' | 'ses'
  sources: { region: string; from: string; to: string; mode: string }
}

function resolveEnv(): EnvShape {
  const regionPick = pickEnv(
    ['SES_REGION', process.env.SES_REGION],
    ['AWS_REGION', process.env.AWS_REGION],
    ['NEXT_PUBLIC_AWS_REGION', process.env.NEXT_PUBLIC_AWS_REGION],
  )

  const fromPick = pickEnv(
    ['SES_FROM', process.env.SES_FROM],
    ['EMAIL_FROM', process.env.EMAIL_FROM],
    ['NEXT_PUBLIC_SES_FROM', process.env.NEXT_PUBLIC_SES_FROM],
  )

  const toPick = pickEnv(
    ['SES_TO', process.env.SES_TO],
    ['EMAIL_TO', process.env.EMAIL_TO],
    ['NEXT_PUBLIC_SES_TO', process.env.NEXT_PUBLIC_SES_TO],
  )

  const rawMode = (process.env.CONTACT_DELIVERY_MODE || '').toLowerCase() as 'mock' | 'ses' | ''
  const emailEnabled = envBool(
    process.env.EMAIL_FEATURE_ENABLED ?? process.env.NEXT_PUBLIC_EMAIL_FEATURE_ENABLED,
    process.env.NODE_ENV === 'production',
  )

  // Choose mode:
  // - explicit CONTACT_DELIVERY_MODE wins
  // - else production → 'ses' if emailEnabled && config present; otherwise 'mock'
  // - else development → 'mock'
  let mode: 'mock' | 'ses' = 'mock'
  if (rawMode === 'mock' || rawMode === 'ses') {
    mode = rawMode
  } else if (process.env.NODE_ENV === 'production') {
    mode = emailEnabled && regionPick.value && fromPick.value && toPick.value ? 'ses' : 'mock'
  } // dev stays 'mock'

  return {
    region: regionPick.value,
    from: fromPick.value,
    to: toPick.value,
    cc: (process.env.SES_CC || '').split(',').map((s) => s.trim()).filter(Boolean),
    bcc: (process.env.SES_BCC || '').split(',').map((s) => s.trim()).filter(Boolean),
    cfgSet: process.env.SES_CONFIGURATION_SET || '',
    emailEnabled,
    ddbTable: process.env.LEADS_DDB_TABLE || '',
    logLevel: (process.env.LOG_LEVEL || 'info').toLowerCase(),
    mode,
    sources: {
      region: regionPick.source,
      from: fromPick.source,
      to: toPick.source,
      mode: rawMode || '(auto)',
    },
  }
}

/* ────────────────────────── handler ────────────────────────── */

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResp | any>) {
  const requestId =
    (req.headers['x-request-id'] as string) ||
    (req.headers['x-amzn-trace-id'] as string) ||
    `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

  // Quick debug snapshot
  if (req.method === 'GET' && (req.query.dbg === '1' || req.query.debug === '1')) {
    const env = resolveEnv()
    return res.status(200).json({
      ok: true,
      requestId,
      env: {
        region: env.region,
        from: mask(env.from),
        to: mask(env.to),
        cc: env.cc.length,
        bcc: env.bcc.length,
        cfgSet: !!env.cfgSet,
        emailEnabled: env.emailEnabled,
        mode: env.mode,
        sources: env.sources,
      },
    })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed', requestId })
  }

  const env = resolveEnv()
  const meta = {
    ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || (req.socket?.remoteAddress ?? ''),
    ua: req.headers['user-agent'] || '',
    referer: (req.headers['referer'] as string) || '',
    path: req.url || '',
  }

  log('info', '[/api/contact] start', {
    requestId,
    mode: env.mode,
    regionSource: env.sources.region,
    fromSource: env.sources.from,
    toSource: env.sources.to,
    has: { region: !!env.region, from: !!env.from, to: !!env.to },
  })

  /* ── parse & validate body ── */
  const body = (req.body ?? {}) as Body
  const name = (body.name || '').trim()
  const email = (body.email || '').trim()
  const phone = (body.phone || '').trim()

  // Topic and summary stay compatible with old payloads
  const service = (body.service || 'airbnb').toLowerCase()
  const topic =
    body.topic ||
    (service === 'turo' ? 'Turo Management Lead' : 'Airbnb Management Lead')

  if (!name || !email) {
    log('warn', 'missing required fields', { requestId, nameLen: name.length, emailLen: email.length })
    return res.status(400).json({ ok: false, error: 'Name and email are required.', requestId })
  }

  /* ── optional DDB persist (non-blocking) ── */
  let leadId = ''
  if (env.ddbTable) {
    try {
      const { DynamoDBClient, PutItemCommand } = await import('@aws-sdk/client-dynamodb')
      leadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const ddb = new DynamoDBClient({ region: env.region || 'us-east-1' })
      await ddb.send(
        new PutItemCommand({
          TableName: env.ddbTable,
          Item: {
            id: { S: leadId },
            createdAt: { S: nowIso() },
            topic: { S: topic },
            service: { S: service },
            name: { S: name },
            email: { S: email },
            phone: { S: phone },
            source: { S: 'latimere-web' },
            meta_ip: { S: meta.ip },
            meta_ua: { S: meta.ua },
            meta_ref: { S: meta.referer },
            payload: { S: pretty(safeTrim(body)) },
          },
        })
      )
      log('info', 'lead stored to DDB', { requestId, table: env.ddbTable, leadId })
    } catch (e) {
      log('warn', 'DDB write failed (non-fatal)', { requestId, ...errShape(e) })
    }
  }

  /* ── handle delivery modes ── */
  if (env.mode === 'mock') {
    log('info', 'mock delivery (no email sent)', { requestId, name, email: mask(email), topic, service, leadId })
    return res.status(200).json({ ok: true, mocked: true, leadId, requestId })
  }

  // Guard: SES config must be present in 'ses' mode
  if (!env.region || !env.from || !env.to) {
    log('error', 'SES config missing in ses mode', {
      requestId,
      region: env.region,
      from: mask(env.from),
      to: mask(env.to),
      sources: env.sources,
    })
    // In production we fail; in dev we return mocked success
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ ok: false, error: 'Server email configuration is incomplete.', requestId })
    }
    return res.status(200).json({ ok: true, mocked: true, leadId, requestId, dev: { reason: 'missing ses config' } })
  }

  /* ── compose email ── */
  const { subject, text, html } = buildEmail({
    topic,
    name,
    email,
    phone,
    body,
    meta: { ...meta, requestId },
  })

  /* ── send via SES v2 ── */
  try {
    const ses = new SESv2Client({ region: env.region })
    log('info', 'sending via SES', {
      requestId,
      from: mask(env.from),
      to: mask(env.to),
      cc: env.cc.length,
      bcc: env.bcc.length,
      cfgSet: env.cfgSet || '(none)',
      subject,
    })

    const out = await ses.send(
      new SendEmailCommand({
        FromEmailAddress: env.from,
        Destination: {
          ToAddresses: [env.to],
          ...(env.cc.length ? { CcAddresses: env.cc } : {}),
          ...(env.bcc.length ? { BccAddresses: env.bcc } : {}),
        },
        ReplyToAddresses: [email],
        ...(env.cfgSet ? { ConfigurationSetName: env.cfgSet } : {}),
        Content: {
          Simple: {
            Subject: { Data: subject },
            Body: {
              Text: { Data: text },
              Html: { Data: html },
            },
          },
        },
      })
    )

    log('info', '✅ SES sent', {
      requestId,
      messageId: (out as any)?.MessageId,
      meta: (out as any)?.$metadata,
    })

    return res.status(200).json({ ok: true, leadId, requestId })
  } catch (e: any) {
    log('error', '❌ SES send failed', { requestId, ...errShape(e) })
    // Production: surface error; Dev: degrade to mocked success
    if (process.env.NODE_ENV === 'production') {
      const payload: ApiResp = { ok: false, error: 'Email failed to send.', requestId }
      if (process.env.LOG_LEVEL === 'debug') payload.dev = errShape(e)
      return res.status(500).json(payload)
    }
    return res.status(200).json({ ok: true, mocked: true, leadId, requestId, dev: errShape(e) })
  }
}

/* ───────────────────── email composition ───────────────────── */

function buildEmail({
  topic,
  name,
  email,
  phone,
  body,
  meta,
}: {
  topic: string
  name: string
  email: string
  phone: string
  body: Body
  meta: { ip: string; ua: string; referer: string; path: string; requestId: string }
}) {
  // Create a readable details block regardless of old/new shapes
  const lines: string[] = []
  if (body.service) lines.push(`service: ${body.service}`)
  if (body.airbnb?.address) lines.push(`address: ${body.airbnb.address}`)
  if (body.airbnb?.sleeps) lines.push(`sleeps: ${body.airbnb.sleeps}`)
  if (body.airbnb?.listedBefore) lines.push(`listedBefore: ${body.airbnb.listedBefore}`)
  if (body.airbnb?.squareFootage) lines.push(`squareFootage: ${body.airbnb.squareFootage}`)
  if (body.turo?.make) lines.push(`vehicle.make: ${body.turo.make}`)
  if (body.turo?.model) lines.push(`vehicle.model: ${body.turo.model}`)
  if (body.turo?.year) lines.push(`vehicle.year: ${body.turo.year}`)
  if (body.turo?.location) lines.push(`vehicle.location: ${body.turo.location}`)
  if (body.message) lines.push(`message: ${body.message}`)
  const extrasText = lines.join('\n')

  const subject = `Latimere: ${topic}`
  const html =
    `<h2 style="margin:0 0 12px">${escapeHtml(subject)}</h2>
<p><strong>Name:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<p><strong>Phone:</strong> ${escapeHtml(phone || '(none)')}</p>
${extrasText ? `<h3 style="margin:16px 0 8px">Details</h3><pre style="white-space:pre-wrap;font-family:ui-monospace,Menlo,Consolas,monospace;background:#0b0f19;color:#e5e7eb;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.12)">${escapeHtml(extrasText)}</pre>` : ''}
<hr style="border:none;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0" />
<p style="font-size:12px;color:#9aa2b1;">IP: ${escapeHtml(meta.ip)} • UA: ${escapeHtml(meta.ua)}<br/>Ref: ${escapeHtml(meta.referer)} • Path: ${escapeHtml(meta.path)}<br/>RequestId: ${escapeHtml(meta.requestId)}</p>
<p style="margin-top:8px;color:#9aa2b1">Sent from Latimere website.</p>`

  const text =
    `${subject}\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || '(none)'}\n` +
    (extrasText ? `\nDetails\n-------\n${extrasText}\n` : '') +
    `\nIP: ${meta.ip}\nUA: ${meta.ua}\nRef: ${meta.referer}\nPath: ${meta.path}\nRequestId: ${meta.requestId}\n\nSent from Latimere website.\n`

  return { subject, text, html }
}

/* ───────────────────────── misc ───────────────────────── */

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]!))
}

function safeTrim<T = any>(v: T): T {
  try {
    const json = JSON.stringify(v)
    if (json.length > 64_000) return JSON.parse(json.slice(0, 64_000)) // best effort
    return v
  } catch {
    return v
  }
}

/** Keep payloads modest */
export const config = { api: { bodyParser: { sizeLimit: '64kb' } } }

/* Amplify Params - DO NOT EDIT
  ENV
  REGION
Amplify Params - DO NOT EDIT */

const crypto = require('crypto')
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses')
const { unmarshall } = require('@aws-sdk/util-dynamodb')

/* ──────────────────────────────────────────────────────────
   Environment / config
   ────────────────────────────────────────────────────────── */
const REGION = process.env.AWS_REGION || process.env.REGION || 'us-east-1'
const ses = new SESClient({ region: REGION })

// Required
const FROM = process.env.SENDER_EMAIL // e.g. no-reply@latimere.com (SES-verified)
// Optional, defaults to local dev
const APP_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '')
// Token signing (recommended) — if not set, we’ll still produce a token string so the page doesn’t say “Missing token”
const INVITE_TOKEN_SECRET = process.env.INVITE_TOKEN_SECRET || ''
// Expiry for new tokens (minutes). If your Invitation already has expiresAt, we’ll include that as well.
const INVITE_TTL_MINUTES = Number(process.env.INVITE_TTL_MINUTES || 60 * 24) // default 24h

/* ──────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────── */

function base64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

/**
 * Create a compact, signed token that the /invite/accept page can validate.
 * If INVITE_TOKEN_SECRET is not configured, we still produce a random token string
 * so the page won’t error on “Missing token”.
 */
function makeInviteToken(payload) {
  try {
    // include an absolute expiry
    const now = Math.floor(Date.now() / 1000)
    const exp =
      typeof payload.exp === 'number'
        ? payload.exp
        : now + Math.max(60, INVITE_TTL_MINUTES * 60)

    const body = { v: 1, iat: now, exp, ...payload }
    const bodyJson = JSON.stringify(body)
    const b = base64url(bodyJson)

    if (!INVITE_TOKEN_SECRET) {
      // Unsigned fallback (still unique, still lets the page proceed)
      const nonce = base64url(crypto.randomBytes(24))
      return `${b}.${nonce}.unsigned`
    }
    const sig = base64url(
      crypto.createHmac('sha256', INVITE_TOKEN_SECRET).update(b).digest()
    )
    return `${b}.${sig}.hs256`
  } catch (e) {
    console.warn('⚠️ Failed to make invite token, using nonce:', e)
    return base64url(crypto.randomBytes(24)) + '.fallback'
  }
}

function buildAcceptUrl({ id, email, role, ownerSub, expiresAt }) {
  const token = makeInviteToken({ id, email, role, ownerSub, exp: expiresAt })
  const url =
    `${APP_URL}/invite/accept` +
    `?id=${encodeURIComponent(id)}` +
    `&email=${encodeURIComponent(email)}` +
    `&role=${encodeURIComponent(role || 'cleaner')}` +
    `&token=${encodeURIComponent(token)}`
  return { url, token }
}

/* ──────────────────────────────────────────────────────────
   Lambda handler
   ────────────────────────────────────────────────────────── */
exports.handler = async (event) => {
  // Loud config logs (useful when debugging prod vs dev)
  if (!FROM) console.error('🚨 Missing SENDER_EMAIL env var; email send will be skipped.')
  console.log('ℹ️  ENV:', {
    REGION,
    FROM,
    APP_URL,
    INVITE_TOKEN_SECRET: INVITE_TOKEN_SECRET ? 'set' : 'missing',
    INVITE_TTL_MINUTES,
  })
  console.log('📨 DynamoDB Stream event:', JSON.stringify({ records: event?.Records?.length || 0 }))

  const records = Array.isArray(event?.Records) ? event.Records : []
  const errors = []

  await Promise.all(
    records.map(async (r, idx) => {
      try {
        const newRaw = r?.dynamodb?.NewImage
        if (!newRaw) return
        const newImg = unmarshall(newRaw)
        const oldImg = r?.dynamodb?.OldImage ? unmarshall(r.dynamodb.OldImage) : undefined

        // Only Invitation items
        if (newImg.__typename !== 'Invitation') {
          console.log(`↪️ [${idx}] Skipping __typename=${newImg.__typename}`)
          return
        }

        // Send on INSERT or when lastSentAt changed (resend)
        let shouldSend = r.eventName === 'INSERT'
        if (!shouldSend && r.eventName === 'MODIFY') {
          if (newImg.lastSentAt && (!oldImg || newImg.lastSentAt !== oldImg.lastSentAt)) {
            shouldSend = true
          }
        }
        if (!shouldSend) {
          console.log(`↪️ [${idx}] No send needed (event=${r.eventName}).`)
          return
        }

        const {
          id,
          email,
          role = 'cleaner',
          ownerSub,        // helpful for token/context if present in your schema
          expiresAt,       // ISO string or epoch seconds if your model sets it
        } = newImg

        if (!email) {
          console.warn(`⚠️ [${idx}] Invitation missing email; id=${id}`)
          return
        }
        if (!FROM) {
          console.error(`🚫 [${idx}] No SENDER_EMAIL configured; cannot send email for id=${id}`)
          return
        }

        const { url: acceptUrl, token } = buildAcceptUrl({
          id,
          email,
          role,
          ownerSub,
          // if expiresAt is ISO, convert to seconds; otherwise pass through
          expiresAt:
            typeof expiresAt === 'string'
              ? Math.floor(new Date(expiresAt).getTime() / 1000)
              : typeof expiresAt === 'number'
              ? expiresAt
              : undefined,
        })

        const subject = `You're invited to join Latimere Host OS as a ${role}`
        const bodyText = [
          `You've been invited to Latimere Host OS as a ${role}.`,
          ``,
          `Accept your invite by clicking the link below:`,
          `${acceptUrl}`,
          ``,
          `This link is uniquely generated for ${email}.`,
          INVITE_TOKEN_SECRET
            ? `The token is signed and expires automatically.`
            : `Note: token is unsigned (INVITE_TOKEN_SECRET not set).`,
        ]
          .filter(Boolean)
          .join('\n')

        const bodyHtml = `
          <html>
            <body>
              <p>You've been invited to <strong>Latimere Host OS</strong> as a <strong>${role}</strong>.</p>
              <p><a href="${acceptUrl}">Accept your invite</a></p>
              <p style="color:#666;font-size:12px;">
                Invite for <code>${email}</code>.
                ${INVITE_TOKEN_SECRET ? 'Signed token.' : 'Unsigned token.'}
              </p>
            </body>
          </html>`

        console.log(
          `✉️  [${idx}] Sending invite:`,
          JSON.stringify({
            id,
            to: email,
            role,
            acceptUrl,
            tokenPreview: token?.slice?.(0, 16) || null,
          })
        )

        const cmd = new SendEmailCommand({
          Source: FROM,
          Destination: { ToAddresses: [email] },
          Message: {
            Subject: { Data: subject },
            Body: {
              Text: { Data: bodyText },
              Html: { Data: bodyHtml },
            },
          },
        })

        const resp = await ses.send(cmd)
        console.log(`✅ [${idx}] SES accepted`, {
          messageId: resp?.MessageId || resp?.$metadata?.requestId,
          requestId: resp?.$metadata?.requestId,
          httpStatusCode: resp?.$metadata?.httpStatusCode,
        })
      } catch (e) {
        console.error(`🔥 [${idx}] send failed:`, e?.stack || e)
        errors.push(e)
      }
    })
  )

  if (errors.length) {
    throw new Error(`One or more invitation emails failed (${errors.length}). See CloudWatch logs.`)
  }
  return { ok: true }
}

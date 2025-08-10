// pages/api/invitations/send.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'

const REGION = process.env.AWS_REGION || 'us-east-1'
const FROM = process.env.SES_FROM
const APP_URL = process.env.APP_URL

// Fail fast if misconfigured (helps you catch env issues early)
function assertEnv() {
  const missing: string[] = []
  if (!FROM) missing.push('SES_FROM')
  if (!APP_URL) missing.push('APP_URL')
  if (!REGION) missing.push('AWS_REGION')
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`)
  }
}

const ses = new SESv2Client({ region: REGION })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    assertEnv()
    const { email, token } = (req.body || {}) as { email?: string; token?: string }

    // Basic validation
    if (!email || !token) {
      console.error('[send-invite] 400 missing fields', { email: !!email, token: !!token })
      return res.status(400).json({ error: 'email and token are required' })
    }

    // Build link
    const link = `${APP_URL!.replace(/\/$/, '')}/invite/accept?token=${encodeURIComponent(token)}`
    const subject = 'Your Latimere Host OS invite'
    const html = `
      <p>You’ve been invited to <b>Latimere Host OS</b> as a cleaner.</p>
      <p>Click the link below to accept your invite:</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link will expire soon. If you weren’t expecting this, you can ignore this email.</p>
    `
    const text =
      `You’ve been invited to Latimere Host OS as a cleaner.\n` +
      `Open this link to accept: ${link}\n` +
      `If you didn’t expect this, ignore this email.`

    // Send email
    const cmd = new SendEmailCommand({
      FromEmailAddress: FROM!,
      Destination: { ToAddresses: [email] },
      Content: {
        Simple: {
          Subject: { Data: subject },
          Body: { Html: { Data: html }, Text: { Data: text } },
        },
      },
    })

    const resp = await ses.send(cmd)
    console.log('[send-invite] sent', { to: email, messageId: resp?.MessageId })

    return res.status(200).json({ ok: true, messageId: resp?.MessageId })
  } catch (e: any) {
    console.error('[send-invite] error', e)
    return res.status(500).json({ error: e?.message || 'Failed to send invite' })
  }
}

/* Amplify Params - DO NOT EDIT
	ENV
	REGION
Amplify Params - DO NOT EDIT *//* Amplify Params - DO NOT EDIT
  ENV
  REGION
Amplify Params - DO NOT EDIT */

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const crypto = require('crypto');

// --------- Env / clients ----------
const REGION = process.env.AWS_REGION || process.env.REGION || 'us-east-1';
const ses = new SESClient({ region: REGION });

// Sender + app URL
const FROM = process.env.SENDER_EMAIL;                  // e.g. no_reply@yourdomain.com (verified in SES)
const APP_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, ''); // strip trailing /

/**
 * Optional security: short-lived HMAC token added to invite link.
 * Set INVITE_TOKEN_SECRET to enable. TTL defaults to 24h.
 */
const INVITE_TOKEN_SECRET = process.env.INVITE_TOKEN_SECRET || '';
const INVITE_TTL_MINUTES = parseInt(process.env.INVITE_TTL_MINUTES || '1440', 10);

// --------- helpers ----------
/** Create a short-lived HMAC token: base64url(payload).hexsig */
function makeInviteToken({ id, email, role, exp }) {
  if (!INVITE_TOKEN_SECRET) return '';
  const payload = JSON.stringify({ id, email, role, exp });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', INVITE_TOKEN_SECRET).update(payload).digest('hex');
  return `${b64}.${sig}`;
}

// --------- handler ----------
exports.handler = async (event) => {
  console.log('📨 Dynamo Stream event:', JSON.stringify(event));
  console.log('ℹ️  REGION:', REGION, 'FROM:', FROM, 'APP_URL:', APP_URL);
  console.log('🔐 token secret set?', !!INVITE_TOKEN_SECRET, 'TTL(min):', INVITE_TTL_MINUTES);

  if (!FROM) {
    console.error('🚨 Missing SENDER_EMAIL env var; aborting send.');
    return { ok: false };
  }

  const records = Array.isArray(event?.Records) ? event.Records : [];
  const errors = [];

  await Promise.all(
    records.map(async (r, idx) => {
      try {
        const newRaw = r?.dynamodb?.NewImage;
        if (!newRaw) {
          console.warn(`⚠️ [${idx}] Missing NewImage, skipping.`);
          return;
        }

        const newImg = unmarshall(newRaw);
        const oldImg = r?.dynamodb?.OldImage ? unmarshall(r.dynamodb.OldImage) : undefined;

        // Only Invitation rows
        if (newImg.__typename !== 'Invitation') {
          console.log(`↪️ [${idx}] Skipping non-Invitation item:`, newImg.__typename);
          return;
        }

        // Send on INSERT, or on MODIFY when lastSentAt changed (Resend)
        let shouldSend = r.eventName === 'INSERT';
        if (!shouldSend && r.eventName === 'MODIFY') {
          if (newImg.lastSentAt && (!oldImg || newImg.lastSentAt !== oldImg.lastSentAt)) {
            shouldSend = true;
          }
        }
        if (!shouldSend) {
          console.log(`↪️ [${idx}] No send needed (event=${r.eventName}).`);
          return;
        }

        const { id, email, role = 'cleaner' } = newImg || {};
        if (!email) {
          console.warn(`⚠️ [${idx}] Invitation missing email; id=${id}`);
          return;
        }

        // Compute link expiry (email copy) and optional signed token
        const expiresAt = new Date(Date.now() + INVITE_TTL_MINUTES * 60_000).toISOString();
        const token = makeInviteToken({ id, email, role, exp: expiresAt });
        const tokenPreview = token ? `${token.slice(0, 10)}…${token.slice(-6)}` : '(none)';

        // Build URL
        const params = new URLSearchParams({ id, email, role });
        if (token) params.set('token', token);
        const acceptUrl = `${APP_URL}/invite/accept?${params.toString()}`;

        console.log(`✉️  [${idx}] sending to: ${email}`);
        console.log(`🔗 [${idx}] link: ${acceptUrl}`);
        console.log(`🔑 [${idx}] token attached? ${!!token} preview: ${tokenPreview}`);

        const subject = `You're invited to join as a ${role}`;
        const bodyText = [
          `You've been invited to Latimere Host OS as a ${role}.`,
          ``,
          `Accept your invite: ${acceptUrl}`,
          `This link expires at: ${expiresAt}`,
        ].join('\n');

        const cmd = new SendEmailCommand({
          Source: FROM,
          Destination: { ToAddresses: [email] },
          Message: {
            Subject: { Data: subject },
            Body: { Text: { Data: bodyText } },
          },
        });

        const resp = await ses.send(cmd);
        console.log(`✅ [${idx}] SES accepted:`, JSON.stringify(resp));
      } catch (e) {
        console.error(`🔥 [${idx}] send failed:`, e?.stack || e);
        errors.push(e);
      }
    })
  );

  if (errors.length) throw new Error(`Invitation email failures: ${errors.length}`);
  return { ok: true };
};

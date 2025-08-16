/* Amplify Params - DO NOT EDIT
  ENV
  REGION
Amplify Params - DO NOT EDIT */

'use strict';

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const crypto = require('crypto');

/** ─────────────────────────────────────────────────────────
 *  Environment & clients
 *  ────────────────────────────────────────────────────────*/
const REGION = process.env.AWS_REGION || process.env.REGION || 'us-east-1';
const ses = new SESClient({ region: REGION });

const FROM = process.env.SENDER_EMAIL;                 // e.g. no_reply@latimere.com (SES verified)
const RAW_APP_URL = process.env.APP_URL || 'http://localhost:3000';
const APP_URL = RAW_APP_URL.replace(/\/+$/, '');       // strip trailing slash
const INVITE_TOKEN_SECRET = process.env.INVITE_TOKEN_SECRET || '';
const INVITE_TTL_MINUTES = Number.parseInt(process.env.INVITE_TTL_MINUTES || '1440', 10);
const ENV = process.env.ENV || 'dev';

/** ─────────────────────────────────────────────────────────
 *  Helpers
 *  ────────────────────────────────────────────────────────*/

/** Create a short-lived HMAC token (base64url.payload + hex signature). */
function makeInviteToken(payloadObj) {
  if (!INVITE_TOKEN_SECRET) return ''; // feature disabled
  const payload = JSON.stringify(payloadObj);
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', INVITE_TOKEN_SECRET).update(payload).digest('hex');
  return `${b64}.${sig}`;
}

/** Build the clickable URL for accepting the invite. */
function buildAcceptUrl({ id, email, role, token }) {
  const params = new URLSearchParams({ id, email, role });
  if (token) params.set('token', token);
  return `${APP_URL}/invite/accept?${params.toString()}`;
}

/** Should we send an email for this stream record? */
function shouldSendForRecord(eventName, newImg, oldImg) {
  if (eventName === 'INSERT') return true;
  if (eventName === 'MODIFY') {
    const newSent = newImg?.lastSentAt;
    const oldSent = oldImg?.lastSentAt;
    return Boolean(newSent && newSent !== oldSent); // resend button path
  }
  return false;
}

/** ─────────────────────────────────────────────────────────
 *  Lambda handler
 *  ────────────────────────────────────────────────────────*/
exports.handler = async (event) => {
  console.log('📨 Dynamo Stream event:', JSON.stringify(event));
  console.log('ℹ️ Context:', JSON.stringify({
    region: REGION,
    env: ENV,
    from: FROM,
    appUrl: APP_URL,
    tokenFeature: INVITE_TOKEN_SECRET ? 'enabled' : 'disabled',
    ttlMinutes: INVITE_TTL_MINUTES,
  }));

  if (!FROM) {
    console.error('🚨 Missing SENDER_EMAIL env var; aborting send.');
    return { ok: false, reason: 'missing_sender' };
  }

  const records = Array.isArray(event?.Records) ? event.Records : [];
  const errors = [];

  await Promise.all(
    records.map(async (r, idx) => {
      try {
        const newRaw = r?.dynamodb?.NewImage;
        if (!newRaw) {
          console.warn(`↪️ [${idx}] No NewImage on record; skipping.`);
          return;
        }

        const newImg = unmarshall(newRaw);
        const oldImg = r?.dynamodb?.OldImage ? unmarshall(r.dynamodb.OldImage) : undefined;

        // Only Invitation rows
        if (newImg.__typename !== 'Invitation') {
          console.log(`↪️ [${idx}] Skipping non-Invitation item: ${newImg.__typename}`);
          return;
        }

        if (!shouldSendForRecord(r.eventName, newImg, oldImg)) {
          console.log(`↪️ [${idx}] No send needed (event=${r.eventName}).`);
          return;
        }

        const { id, email, role = 'cleaner' } = newImg;
        if (!email) {
          console.warn(`⚠️ [${idx}] Invitation missing email; id=${id}`);
          return;
        }

        // Compute expiry & token
        const expiresAt = new Date(Date.now() + INVITE_TTL_MINUTES * 60_000).toISOString();
        const token = makeInviteToken({ id, email, role, exp: expiresAt });
        const tokenPreview = token ? `${token.slice(0, 10)}…${token.slice(-6)}` : '(none)';

        const acceptUrl = buildAcceptUrl({ id, email, role, token });

        console.log(`✉️  [${idx}] Sending invite`);
        console.log(
          `    id=${id} email=${email} role=${role} env=${ENV} token=${token ? 'yes' : 'no'} preview=${tokenPreview}`
        );
        console.log(`    link: ${acceptUrl}`);

        // Compose and send email
        const subject = `You're invited to join Latimere as a ${role}`;
        const bodyText = [
          `You've been invited to Latimere Host OS as a ${role}.`,
          '',
          `Accept your invite: ${acceptUrl}`,
          `This link expires at: ${expiresAt}`,
          '',
          `If you did not expect this, you can ignore the email.`,
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

  if (errors.length) {
    // surface failure to DLQ/retry if configured later
    throw new Error(`Invitation email failures: ${errors.length}`);
  }

  return { ok: true };
};

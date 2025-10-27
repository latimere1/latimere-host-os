/* Amplify Params - DO NOT EDIT
  ENV
  REGION
Amplify Params - DO NOT EDIT */

// Use AWS SDK v3 (works on Node.js 22+)
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const REGION = process.env.AWS_REGION || process.env.REGION || 'us-east-1';
const ses = new SESClient({ region: REGION });

const FROM = process.env.SENDER_EMAIL;        // e.g. no-reply@latimere.com (verified in SES, same region)
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

exports.handler = async (event) => {
  // Top-level guardrails so we fail loudly in logs if config is missing
  if (!FROM) {
    console.error('🚨 Missing SENDER_EMAIL env var; aborting send.');
  }
  console.log('📨 Dynamo Stream event:', JSON.stringify(event));
  console.log('ℹ️  Using region:', REGION, 'FROM:', FROM, 'APP_URL:', APP_URL);

  const records = Array.isArray(event?.Records) ? event.Records : [];
  const errors = [];

  await Promise.all(records.map(async (r, idx) => {
    try {
      const newRaw = r?.dynamodb?.NewImage;
      if (!newRaw) return;

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

      const { id, email, role = 'cleaner', expiresAt } = newImg;
      if (!email) {
        console.warn(`⚠️ [${idx}] Invitation missing email; id=${id}`);
        return;
      }
      if (!FROM) {
        console.error(`🚫 [${idx}] No SENDER_EMAIL configured; cannot send email for id=${id}`);
        return;
      }

      const acceptUrl =
        `${APP_URL}/invite/accept?id=${encodeURIComponent(id)}&email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`;

      const subject = `You're invited to join as a ${role}`;
      const bodyText = [
        `You've been invited to Latimere Host OS as a ${role}.`,
        ``,
        `Accept your invite: ${acceptUrl}`,
        expiresAt ? `This link expires at: ${expiresAt}` : '',
      ].join('\n');

      console.log(`✉️  [${idx}] Sending to: ${email}  link: ${acceptUrl}`);

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
  }));

  if (errors.length) {
    // surface failure to DLQ/retry if you configure one later
    throw new Error(`One or more invitation emails failed (${errors.length}). See logs.`);
  }

  return { ok: true };
};

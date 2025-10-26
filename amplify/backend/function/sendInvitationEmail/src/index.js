/* Amplify Params - DO NOT EDIT
  ENV
  REGION
Amplify Params - DO NOT EDIT */

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const crypto = require('crypto');

const REGION = process.env.AWS_REGION || process.env.REGION || 'us-east-1';
const ses = new SESClient({ region: REGION });
const ddb = new DynamoDBClient({ region: REGION });

const FROM = process.env.SENDER_EMAIL;                   // e.g. no_reply@yourdomain.com (verified in SES)
const APP_URL = process.env.APP_URL || 'http://localhost:3000'; // e.g. https://app.example.com

exports.handler = async (event) => {
  if (!FROM) console.error('🚨 Missing SENDER_EMAIL');
  console.log('📨 Dynamo Stream event:', JSON.stringify(event));
  console.log('ℹ️ REGION:', REGION, 'FROM:', FROM, 'APP_URL:', APP_URL);

  const records = Array.isArray(event?.Records) ? event.Records : [];
  const errors = [];

  // Derive table name (handy for UpdateItem below)
  const streamArn = records[0]?.eventSourceARN || '';
  const tableName = streamArn.split(':table/')[1]?.split('/stream/')[0];
  if (!tableName) console.warn('⚠️ Could not derive table name from stream ARN');

  await Promise.all(
    records.map(async (r, idx) => {
      try {
        const newRaw = r?.dynamodb?.NewImage;
        if (!newRaw) {
          console.log(`↪️ [${idx}] No NewImage; skipping`);
          return;
        }

        const newImg = unmarshall(newRaw);
        const oldImg = r?.dynamodb?.OldImage ? unmarshall(r.dynamodb.OldImage) : undefined;

        // Safety: only react to Invitation items
        if (newImg.__typename !== 'Invitation') {
          console.log(`↪️ [${idx}] Skipping non-Invitation type:`, newImg.__typename);
          return;
        }

        const eventName = r.eventName; // INSERT | MODIFY | REMOVE
        const newLastSentAt = newImg.lastSentAt || null;
        const oldLastSentAt = oldImg?.lastSentAt || null;

        console.log(
          `🔎 [${idx}] Decision data`,
          JSON.stringify({
            eventName,
            status: newImg.status,
            newLastSentAt,
            oldLastSentAt,
          })
        );

        // 1) Trigger conditions
        // - INSERT: always send once if status is PENDING
        // - MODIFY: only send if lastSentAt changed (client asked to resend)
        let shouldSend = false;
        if (eventName === 'INSERT') {
          shouldSend = true;
        } else if (eventName === 'MODIFY') {
          const changed = newLastSentAt !== oldLastSentAt;
          if (changed) shouldSend = true;
        }

        if (!shouldSend) {
          console.log(`↪️ [${idx}] No send needed (event=${eventName}, lastSentAt changed? ${newLastSentAt !== oldLastSentAt})`);
          return;
        }

        // 2) Respect status
        if (newImg.status && newImg.status !== 'PENDING') {
          console.log(`↪️ [${idx}] Status=${newImg.status}; skip sending`);
          return;
        }

        // 3) Basic validation
        const { id, email, role = 'cleaner', expiresAt } = newImg;
        if (!email) {
          console.warn(`⚠️ [${idx}] Missing email for id=${id}`);
          return;
        }
        if (!FROM) {
          console.error(`🚫 [${idx}] No SENDER_EMAIL configured; aborting send for id=${id}`);
          return;
        }

        // 4) Throttle guard (use the *old* value when MODIFY; avoid “0.0 mins ago”)
        const now = new Date();
        let sentAgoMins = 1e6; // large default
        if (eventName === 'MODIFY' && oldLastSentAt) {
          sentAgoMins = (now - new Date(oldLastSentAt)) / 60000;
        } else if (eventName === 'INSERT' && newLastSentAt) {
          // For inserts, if creator set lastSentAt in same write, honor it
          sentAgoMins = (now - new Date(newLastSentAt)) / 60000;
        }
        console.log(`⏱️ [${idx}] Throttle check → sentAgoMins=${sentAgoMins.toFixed(3)}`);

        // Keep a tiny guard to collapse accidental rapid duplicate clicks
        if (sentAgoMins < 0.05) {
          console.log(`↪️ [${idx}] Throttled (duplicate within ~3s); skipping send`);
          return;
        }

        // 5) Generate a fresh token & store only the tokenHash.
        //    IMPORTANT: We DO NOT touch lastSentAt here, so we don't trigger ourselves again.
        const token = crypto.randomUUID();
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const isoNow = now.toISOString();

        if (tableName) {
          await ddb.send(
            new UpdateItemCommand({
              TableName: tableName,
              Key: { id: { S: String(id) } },
              // Note: we only update tokenHash + updatedAt here.
              UpdateExpression: 'SET tokenHash = :th, updatedAt = :u',
              ExpressionAttributeValues: {
                ':th': { S: tokenHash },
                ':u': { S: isoNow },
              },
            })
          );
          console.log(`🗄️ [${idx}] Wrote tokenHash (no change to lastSentAt)`);
        } else {
          console.warn(`⚠️ [${idx}] No table name; cannot persist tokenHash`);
        }

        const acceptUrl =
          `${APP_URL}/invite/accept` +
          `?id=${encodeURIComponent(id)}` +
          `&email=${encodeURIComponent(email)}` +
          `&role=${encodeURIComponent(role)}` +
          `&token=${encodeURIComponent(token)}`;

        const subject = `You're invited to join as a ${role}`;
        const bodyText = [
          `You've been invited to Latimere Host OS as a ${role}.`,
          ``,
          `Accept your invite: ${acceptUrl}`,
          expiresAt ? `This link expires at: ${expiresAt}` : '',
        ].join('\n');

        console.log(`✉️ [${idx}] Sending to: ${email}`);
        console.log(`🔗 [${idx}] Link: ${acceptUrl}`);

        const resp = await ses.send(
          new SendEmailCommand({
            Source: FROM,
            Destination: { ToAddresses: [email] },
            Message: {
              Subject: { Data: subject },
              Body: { Text: { Data: bodyText } },
            },
          })
        );

        console.log(`✅ [${idx}] SES send ok`, JSON.stringify(resp));
      } catch (e) {
        console.error(`🔥 [${idx}] send failed:`, e?.stack || e);
        errors.push(e);
      }
    })
  );

  if (errors.length) throw new Error(`One or more emails failed (${errors.length})`);
  return { ok: true };
};

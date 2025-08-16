/* Amplify Params - DO NOT EDIT
  ENV
  REGION
Amplify Params - DO NOT EDIT */

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const crypto = require('crypto');

const REGION = process.env.AWS_REGION || process.env.REGION || 'us-east-1';
const ENV = process.env.ENV || process.env.NODE_ENV || 'dev';
const ses = new SESClient({ region: REGION });
const ddb = new DynamoDBClient({ region: REGION });

const FROM = process.env.SENDER_EMAIL;
const APP_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const INVITE_TOKEN_SECRET = process.env.INVITE_TOKEN_SECRET || '';
const INVITE_TTL_MINUTES = parseInt(process.env.INVITE_TTL_MINUTES || '1440', 10);

function makeToken(payload) {
  if (!INVITE_TOKEN_SECRET) return '';
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString('base64url');
  const sig = crypto.createHmac('sha256', INVITE_TOKEN_SECRET).update(json).digest('hex');
  return `${b64}.${sig}`;
}
function sha256Hex(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}
function tableFromArn(arn) {
  const after = (arn || '').split(':table/')[1] || '';
  return after.split('/')[0] || '';
}

exports.handler = async (event) => {
  console.log('📨 event:', JSON.stringify(event));
  console.log('CFG', { REGION, ENV, FROM, APP_URL, INVITE_TTL_MINUTES, hasSecret: !!INVITE_TOKEN_SECRET });

  if (!FROM) {
    console.error('🚫 Missing SENDER_EMAIL, aborting.');
    return { ok: false };
  }

  const records = Array.isArray(event?.Records) ? event.Records : [];
  const errors = [];

  await Promise.all(records.map(async (r, i) => {
    try {
      const newImg = r?.dynamodb?.NewImage ? unmarshall(r.dynamodb.NewImage) : null;
      const oldImg = r?.dynamodb?.OldImage ? unmarshall(r.dynamodb.OldImage) : null;
      if (!newImg) return;

      if (newImg.__typename !== 'Invitation') {
        console.log(`[${i}] skip type`, newImg.__typename);
        return;
      }

      let shouldSend = r.eventName === 'INSERT';
      if (!shouldSend && r.eventName === 'MODIFY') {
        if (newImg.lastSentAt && (!oldImg || newImg.lastSentAt !== oldImg.lastSentAt)) shouldSend = true;
      }
      if (!shouldSend) {
        console.log(`[${i}] no send (event=${r.eventName})`);
        return;
      }

      const { id, email, role = 'cleaner' } = newImg;
      if (!email) {
        console.warn(`[${i}] missing email for id=${id}`);
        return;
      }

      const tableName = tableFromArn(r.eventSourceARN);
      const expiresAt = new Date(Date.now() + INVITE_TTL_MINUTES * 60000).toISOString();

      const token = makeToken({ id, email, role, exp: expiresAt });
      const tokenHash = token ? sha256Hex(token) : '';
      console.log(`[${i}] token? ${!!token} preview=${token ? token.slice(0,10)+'…'+token.slice(-6) : '(none)'} table=${tableName}`);

      // Persist tokenHash/expiresAt so the Accept page can find it
      if (tableName && token) {
        const nowIso = new Date().toISOString();
        try {
          await ddb.send(new UpdateItemCommand({
            TableName: tableName,
            Key: { id: { S: id } },
            UpdateExpression: 'SET #th=:th, #exp=:exp, #ls=:ls',
            ExpressionAttributeNames: { '#th': 'tokenHash', '#exp': 'expiresAt', '#ls': 'lastSentAt' },
            ExpressionAttributeValues: { ':th': { S: tokenHash }, ':exp': { S: expiresAt }, ':ls': { S: nowIso } },
          }));
          console.log(`[${i}] tokenHash/expiresAt updated`);
        } catch (e) {
          console.error(`[${i}] failed to update tokenHash/expiresAt`, e);
        }
      }

      const qs = new URLSearchParams({ id, email, role });
      if (token) qs.set('token', token);
      const acceptUrl = `${APP_URL}/invite/accept?${qs.toString()}`;
      console.log(`[${i}] link ${acceptUrl}`);

      const cmd = new SendEmailCommand({
        Source: FROM,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: `You're invited to join as a ${role}` },
          Body: { Text: { Data: `You've been invited to Latimere Host OS as a ${role}.\n\nAccept your invite: ${acceptUrl}\nThis link expires at: ${expiresAt}\n` } },
        },
      });
      const resp = await ses.send(cmd);
      console.log(`[${i}] SES ok`, JSON.stringify(resp));
    } catch (e) {
      console.error(`[${i}] send failed`, e);
      errors.push(e);
    }
  }));

  if (errors.length) throw new Error(`invitation email failures: ${errors.length}`);
  return { ok: true };
};

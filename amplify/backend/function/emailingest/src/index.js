const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { SignatureV4 } = require("@aws-sdk/signature-v4");
const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const { HttpRequest } = require("@aws-sdk/protocol-http");
const { Sha256 } = require("@aws-crypto/sha256-js");
const https = require("https");
const { simpleParser } = require("mailparser");

const region = process.env.REGION;
const endpoint =
  process.env.API_LATIMEREHOSTOS_GRAPHQLAPIENDPOINTOUTPUT ||
  process.env.API_URL ||
  process.env.GRAPHQL_ENDPOINT ||
  process.env.GRAPHQL_URL;

if (!endpoint) {
  console.error(JSON.stringify({ tag: "EMAIL_INGEST_FATAL", msg: "Missing GraphQL endpoint", env: process.env }));
  throw new Error("No valid GraphQL endpoint in environment variables");
}

console.log(JSON.stringify({ tag: "EMAIL_INGEST_ENDPOINT", endpoint }));

const BUCKET = process.env.INBOUND_BUCKET || "latimere-inbound-mail";
const PREFIX = process.env.INBOUND_PREFIX || "inbound/";
const s3 = new S3Client({ region });

async function callGraphQL(query, variables) {
  const body = JSON.stringify({ query, variables });
  const url = new URL(endpoint);

  const req = new HttpRequest({
    method: "POST",
    protocol: "https:",
    path: url.pathname,
    headers: {
      "Content-Type": "application/json",
      host: url.host,
      ...(body ? { "Content-Length": Buffer.byteLength(body) } : {})
    },
    hostname: url.hostname,
    body
  });

  const signer = new SignatureV4({
    service: "appsync",
    region,
    credentials: defaultProvider(),
    sha256: Sha256
  });

  const signed = await signer.sign(req);

  return new Promise((resolve, reject) => {
    const r = https.request(
      {
        hostname: signed.hostname,
        method: signed.method,
        path: signed.path,
        headers: signed.headers
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.errors) return reject(json.errors);
            resolve(json.data);
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    r.on("error", reject);
    if (signed.body) r.write(signed.body);
    r.end();
  });
}

const UPSERT_THREAD_AND_MESSAGE = `
mutation Upsert($thread: CreateInboxThreadInput!, $msg: CreateInboxMessageInput!) {
  createInboxThread(input: $thread) { id }
  createInboxMessage(input: $msg) { id }
}`;

exports.handler = async (event) => {
  console.log(JSON.stringify({ tag: "EMAIL_INGEST_START", records: event?.Records?.length || 0 }));

  try {
    const ses = event.Records?.[0]?.ses;
    const mail = ses?.mail || {};
    const messageId = mail?.messageId;
    const to = (mail?.destination || [])[0] || "";
    const from = mail?.source || "";

    if (!messageId) {
      console.log(JSON.stringify({ tag: "EMAIL_INGEST_NO_MSGID" }));
      return { ok: true, skip: true };
    }

    const key = `${PREFIX}${messageId}`;
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const raw = await obj.Body.transformToByteArray();
    const parsed = await simpleParser(Buffer.from(raw));

    const maskedEmail = to;
    const subject = parsed.subject || "(no subject)";
    const text = parsed.text || parsed.html || "";
    const now = new Date().toISOString();

    const threadInput = {
      owner: "system",
      maskedEmail,
      aiStatus: "active",
      lastMessageAt: now
    };

    const messageInput = {
      owner: "system",
      threadId: "", // auto-linked by AppSync resolver
      from: "guest",
      createdAt: now,
      body: `[${from}] ${subject}\n\n${text.substring(0, 5000)}`
    };

    console.log(JSON.stringify({ tag: "EMAIL_VARS_HTTP_PRE", vars: { threadInput, messageInput } }));

    const result = await callGraphQL(UPSERT_THREAD_AND_MESSAGE, {
      thread: threadInput,
      msg: messageInput
    });

    console.log(JSON.stringify({ tag: "EMAIL_VARS_HTTP_POST", result }));
    console.log(JSON.stringify({ tag: "EMAIL_INGEST_OK", key, from, to: maskedEmail, subject }));
    return { ok: true };
  } catch (err) {
    console.log(JSON.stringify({ tag: "EMAIL_INGEST_ERR", err: String(err) }));
    return { ok: false };
  }
};

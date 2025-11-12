/* eslint-disable no-console */
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

/**
 * Accept Answer Trigger
 * ---------------------
 * DynamoDB Streams trigger for the Answer table to:
 *  - Set/clear the parent Post.acceptedAnswerId when an answer is (un)accepted
 *  - Adjust the Answer owner's reputation on accept/unaccept
 *
 * Expected Answer attributes:
 *   id          : string (PK)
 *   postId      : string
 *   owner       : string (answer author userId)
 *   isAccepted  : boolean
 *
 * Environment variables (configure via Amplify function parameters/overrides):
 *   TABLE_POST             : Post table name
 *   TABLE_ANSWER           : Answer table name (source stream)
 *   TABLE_USERPROFILE      : UserProfile table name
 *   ACCEPT_POINTS          : integer (default 15) reputation delta for accepted answer
 */

const {
  TABLE_POST,
  TABLE_ANSWER,
  TABLE_USERPROFILE,
  ACCEPT_POINTS,
  AWS_REGION = process.env.AWS_REGION || "us-east-1",
} = process.env;

const ACCEPT_DELTA = Number.isFinite(Number(ACCEPT_POINTS)) ? Number(ACCEPT_POINTS) : 15;

const ddb = new DynamoDBClient({ region: AWS_REGION });

/** Env validation logs (fail-soft) */
function assertEnv(name, val) {
  if (!val) console.error(`❌ Missing required env ${name}`);
  else console.log(`🔧 env ${name}=${val}`);
}
assertEnv("TABLE_POST", TABLE_POST);
assertEnv("TABLE_ANSWER", TABLE_ANSWER);
assertEnv("TABLE_USERPROFILE", TABLE_USERPROFILE);
console.log(`🔧 ACCEPT_DELTA=${ACCEPT_DELTA}`);

function readStreamImages(record) {
  const newImage = record?.dynamodb?.NewImage ? unmarshall(record.dynamodb.NewImage) : null;
  const oldImage = record?.dynamodb?.OldImage ? unmarshall(record.dynamodb.OldImage) : null;
  return { newImage, oldImage };
}

/** Derive accept/unaccept transition (+delta/-delta) and target fields */
function deriveAcceptance(record) {
  const { eventName } = record;
  const { newImage, oldImage } = readStreamImages(record);

  const nx = !!newImage?.isAccepted;
  const ox = !!oldImage?.isAccepted;

  let action = "noop";       // "accept" | "unaccept" | "noop"
  if (eventName === "INSERT") {
    action = nx ? "accept" : "noop";
  } else if (eventName === "REMOVE") {
    action = ox ? "unaccept" : "noop";
  } else if (eventName === "MODIFY") {
    if (!ox && nx) action = "accept";
    else if (ox && !nx) action = "unaccept";
    else action = "noop";
  }

  // Prefer stream images; fall back to separate fetch if missing
  const answerId = (newImage?.id || oldImage?.id) ?? null;
  const postId = (newImage?.postId || oldImage?.postId) ?? null;
  const ownerId = (newImage?.owner || oldImage?.owner) ?? null;

  return { action, answerId, postId, ownerId, newImage, oldImage, eventName };
}

async function fetchAnswer(answerId) {
  if (!answerId) return null;
  try {
    const res = await ddb.send(
      new GetItemCommand({
        TableName: TABLE_ANSWER,
        Key: { id: { S: String(answerId) } },
        ProjectionExpression: "#id,#pid,#own,#acc",
        ExpressionAttributeNames: {
          "#id": "id",
          "#pid": "postId",
          "#own": "owner",
          "#acc": "isAccepted",
        },
      })
    );
    return res.Item ? unmarshall(res.Item) : null;
  } catch (err) {
    console.error("❌ fetchAnswer failed", { answerId, err });
    return null;
  }
}

/** Set Post.acceptedAnswerId = answerId */
async function setAcceptedAnswer(postId, answerId) {
  if (!postId || !answerId) return;

  try {
    const res = await ddb.send(
      new UpdateItemCommand({
        TableName: TABLE_POST,
        Key: { id: { S: String(postId) } },
        UpdateExpression: "SET #aid = :answerId, #ts = :now",
        ExpressionAttributeNames: {
          "#aid": "acceptedAnswerId",
          "#ts": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":answerId": { S: String(answerId) },
          ":now": { S: new Date().toISOString() },
        },
        ReturnValues: "NONE",
      })
    );
    console.log("✅ Post.acceptedAnswerId set", { postId, answerId });
    return res;
  } catch (err) {
    console.error("❌ setAcceptedAnswer failed", { postId, answerId, err });
  }
}

/** Clear Post.acceptedAnswerId only if it matches this answer id (safety) */
async function clearAcceptedAnswerIfMatches(postId, answerId) {
  if (!postId || !answerId) return;

  try {
    const res = await ddb.send(
      new UpdateItemCommand({
        TableName: TABLE_POST,
        Key: { id: { S: String(postId) } },
        ConditionExpression: "attribute_exists(#aid) AND #aid = :answerId",
        UpdateExpression: "REMOVE #aid SET #ts = :now",
        ExpressionAttributeNames: {
          "#aid": "acceptedAnswerId",
          "#ts": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":answerId": { S: String(answerId) },
          ":now": { S: new Date().toISOString() },
        },
        ReturnValues: "NONE",
      })
    );
    console.log("✅ Post.acceptedAnswerId cleared (matched)", { postId, answerId });
    return res;
  } catch (err) {
    // If ConditionalCheckFailedException, it's fine — another accepted answer may be in place.
    const code = err?.name || err?.Code || err?.code;
    if (code === "ConditionalCheckFailedException") {
      console.log("ℹ️ acceptedAnswerId did not match; left unchanged", { postId, answerId });
    } else {
      console.error("❌ clearAcceptedAnswerIfMatches failed", { postId, answerId, err });
    }
  }
}

/** Adjust reputation for the answer owner */
async function bumpAnswerOwnerReputation(ownerId, delta) {
  if (!ownerId || !delta) return;
  try {
    await ddb.send(
      new UpdateItemCommand({
        TableName: TABLE_USERPROFILE,
        Key: { id: { S: String(ownerId) } },
        UpdateExpression: "ADD #rep :d SET #ts = :now",
        ExpressionAttributeNames: {
          "#rep": "reputation",
          "#ts": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":d": { N: String(delta) },
          ":now": { S: new Date().toISOString() },
        },
        ReturnValues: "NONE",
      })
    );
    console.log("👤 Owner reputation updated", { ownerId, delta });
  } catch (err) {
    console.error("❌ bumpAnswerOwnerReputation failed", { ownerId, delta, err });
  }
}

/** Main handler */
export const handler = async (event) => {
  console.log("📥 acceptAnswerTrigger invoked", {
    records: event?.Records?.length || 0,
    region: AWS_REGION,
    acceptDelta: ACCEPT_DELTA,
  });

  if (!TABLE_POST || !TABLE_ANSWER || !TABLE_USERPROFILE) {
    console.error("❌ Required env missing; exiting.");
    return;
  }

  const results = { processed: 0, skipped: 0, noops: 0 };

  for (const record of event.Records || []) {
    try {
      const { action, answerId, postId: pid, ownerId: oid, eventName } = deriveAcceptance(record);
      if (action === "noop") {
        results.noops++;
        continue;
      }

      let postId = pid;
      let ownerId = oid;

      // If postId/ownerId are missing from the stream image, fetch the answer directly
      if (!postId || !ownerId) {
        const fetched = await fetchAnswer(answerId);
        postId = postId || fetched?.postId || null;
        ownerId = ownerId || fetched?.owner || null;
      }

      console.log("➡️ Process", { eventName, action, answerId, postId, ownerId });

      if (!answerId || !postId || !ownerId) {
        console.warn("⚠️ Missing critical fields; skipping record", { answerId, postId, ownerId, action });
        results.skipped++;
        continue;
      }

      if (action === "accept") {
        // Set acceptedAnswerId on the Post to this answer id
        await setAcceptedAnswer(postId, answerId);
        // Reputation +ACCEPT_DELTA to the answer owner
        await bumpAnswerOwnerReputation(ownerId, ACCEPT_DELTA);
      } else if (action === "unaccept") {
        // Only clear if this answer is currently set as accepted (safe conditional)
        await clearAcceptedAnswerIfMatches(postId, answerId);
        // Reputation -ACCEPT_DELTA to the answer owner
        await bumpAnswerOwnerReputation(ownerId, -ACCEPT_DELTA);
      }

      results.processed++;
    } catch (err) {
      console.error("❌ Error processing stream record", err);
    }
  }

  console.log("✅ acceptAnswerTrigger complete", results);
  return results;
};

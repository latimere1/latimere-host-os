/* eslint-disable no-console */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

/**
 * Environment variables expected:
 *  - TABLE_POST
 *  - TABLE_ANSWER
 *  - TABLE_USERPROFILE
 * These can be set in amplify/backend/function/voteReputationTrigger/parameters.json
 */

const {
  TABLE_POST,
  TABLE_ANSWER,
  TABLE_USERPROFILE,
  AWS_REGION = process.env.AWS_REGION || "us-east-1",
} = process.env;

const ddb = new DynamoDBClient({ region: AWS_REGION });

function assertEnv(name, val) {
  if (!val) console.error(`❌ Missing env ${name}`);
  else console.log(`✅ env ${name}=${val}`);
}
assertEnv("TABLE_POST", TABLE_POST);
assertEnv("TABLE_ANSWER", TABLE_ANSWER);
assertEnv("TABLE_USERPROFILE", TABLE_USERPROFILE);

/**
 * Parse DynamoDB stream record to get delta and target
 */
function deriveVoteDelta(record) {
  const { eventName, dynamodb } = record;
  const newImage = dynamodb.NewImage ? unmarshall(dynamodb.NewImage) : null;
  const oldImage = dynamodb.OldImage ? unmarshall(dynamodb.OldImage) : null;

  const newVal = Number(newImage?.value || 0);
  const oldVal = Number(oldImage?.value || 0);
  let delta = 0;

  if (eventName === "INSERT") delta = newVal;
  else if (eventName === "REMOVE") delta = -oldVal;
  else if (eventName === "MODIFY") delta = newVal - oldVal;

  const base = newImage || oldImage || {};
  return {
    delta,
    targetType: (base.targetType || "").toUpperCase(),
    targetId: base.targetId,
    voterId: base.voterId,
  };
}

/** Update the score for a Post or Answer */
async function bumpTargetScore(targetType, targetId, delta) {
  if (!delta || !targetId) return;
  const table =
    targetType === "POST" ? TABLE_POST :
    targetType === "ANSWER" ? TABLE_ANSWER : null;

  if (!table) {
    console.warn("⚠️ Unknown targetType", { targetType });
    return;
  }

  console.log("🛠 bumpTargetScore", { targetType, targetId, delta });
  try {
    await ddb.send(
      new UpdateItemCommand({
        TableName: table,
        Key: { id: { S: String(targetId) } },
        UpdateExpression: "ADD #score :d",
        ExpressionAttributeNames: { "#score": "score" },
        ExpressionAttributeValues: { ":d": { N: String(delta) } },
      })
    );
    console.log("✅ Target score updated", { targetType, targetId, delta });
  } catch (err) {
    console.error("❌ bumpTargetScore failed", err);
  }
}

/** Fetch owner for target */
async function fetchTargetOwner(targetType, targetId) {
  const table =
    targetType === "POST" ? TABLE_POST :
    targetType === "ANSWER" ? TABLE_ANSWER : null;

  if (!table || !targetId) return null;

  try {
    const res = await ddb.send(
      new GetItemCommand({
        TableName: table,
        Key: { id: { S: String(targetId) } },
        ProjectionExpression: "#owner",
        ExpressionAttributeNames: { "#owner": "owner" },
      })
    );
    const item = res.Item ? unmarshall(res.Item) : null;
    return item?.owner || null;
  } catch (err) {
    console.error("❌ fetchTargetOwner failed", err);
    return null;
  }
}

/** Update UserProfile reputation and counters */
async function bumpUserReputation({ voterId, ownerId, delta }) {
  if (!delta) return;

  const isUp = delta > 0;
  const givenField = isUp ? "votesGivenUp" : "votesGivenDown";
  const recvField = isUp ? "votesRecvUp" : "votesRecvDown";

  const updates = [];

  if (ownerId) {
    updates.push({
      who: "owner",
      userId: ownerId,
      cmd: new UpdateItemCommand({
        TableName: TABLE_USERPROFILE,
        Key: { id: { S: String(ownerId) } },
        UpdateExpression:
          "ADD #rep :d, #r :one SET #ts = :now",
        ExpressionAttributeNames: {
          "#rep": "reputation",
          "#r": recvField,
          "#ts": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":d": { N: String(delta) },
          ":one": { N: "1" },
          ":now": { S: new Date().toISOString() },
        },
      }),
    });
  }

  if (voterId) {
    updates.push({
      who: "voter",
      userId: voterId,
      cmd: new UpdateItemCommand({
        TableName: TABLE_USERPROFILE,
        Key: { id: { S: String(voterId) } },
        UpdateExpression:
          "ADD #g :one SET #ts = :now",
        ExpressionAttributeNames: {
          "#g": givenField,
          "#ts": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":one": { N: "1" },
          ":now": { S: new Date().toISOString() },
        },
      }),
    });
  }

  for (const u of updates) {
    try {
      await ddb.send(u.cmd);
      console.log("👤 Reputation updated", { who: u.who, userId: u.userId, delta });
    } catch (err) {
      console.error("❌ Reputation update failed", { who: u.who, userId: u.userId, err });
    }
  }
}

export const handler = async (event) => {
  console.log("📥 voteReputationTrigger invoked", {
    records: event?.Records?.length || 0,
    region: AWS_REGION,
  });

  const results = { processed: 0, skipped: 0, noops: 0 };

  for (const record of event.Records || []) {
    const { eventName } = record;
    try {
      const { delta, targetType, targetId, voterId } = deriveVoteDelta(record);

      if (!targetType || !targetId) {
        console.warn("⚠️ Missing target info", { eventName });
        results.skipped++;
        continue;
      }

      if (!delta) {
        console.log("ℹ️ No-op delta", { eventName, targetType, targetId });
        results.noops++;
        continue;
      }

      console.log("➡️ Processing", { eventName, targetType, targetId, delta, voterId });

      await bumpTargetScore(targetType, targetId, delta);
      const ownerId = await fetchTargetOwner(targetType, targetId);
      await bumpUserReputation({ voterId, ownerId, delta });

      results.processed++;
    } catch (err) {
      console.error("❌ Error processing record", { eventName, err });
    }
  }

  console.log("✅ voteReputationTrigger complete", results);
  return results;
};

import crypto from "crypto";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME } from "../config/dynamodb.js";
import { razorpay, PLANS } from "../config/razorpay.js";
import { env } from "../config/env.js";

export async function createOrder(planId: string, userId: string) {
  const plan = PLANS[planId];
  if (!plan) throw new Error(`Invalid plan: ${planId}`);

  const order = await razorpay.orders.create({
    amount: plan.amount,
    currency: plan.currency,
    receipt: `${userId}_${planId}_${Date.now()}`,
    notes: { userId, planId },
  });

  return {
    orderId: order.id,
    amount: plan.amount,
    currency: plan.currency,
    planName: plan.name,
    keyId: env.RAZORPAY_KEY_ID,
  };
}

export function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expected === signature;
}

export async function activateSubscription(
  userId: string,
  planId: string,
  paymentId: string
) {
  const plan = PLANS[planId];
  if (!plan) throw new Error(`Invalid plan: ${planId}`);

  // Calculate expiry
  const now = Date.now();
  let expiryMs: number;
  if (plan.period === "monthly") {
    expiryMs = now + 30 * 24 * 60 * 60 * 1000;
  } else {
    expiryMs = now + 365 * 24 * 60 * 60 * 1000;
  }

  await dynamodb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
      UpdateExpression:
        "SET subscription_status = :tier, subscription_expiry = :exp, payment_id = :pid, plan_id = :plan, updated_at = :now",
      ExpressionAttributeValues: {
        ":tier": plan.tier,
        ":exp": expiryMs,
        ":pid": paymentId,
        ":plan": planId,
        ":now": now,
      },
    })
  );

  return { status: plan.tier, expiry: expiryMs };
}

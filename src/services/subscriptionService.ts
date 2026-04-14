import crypto from "crypto";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME } from "../config/dynamodb.js";
import { getRazorpay, PLANS } from "../config/razorpay.js";
import { env } from "../config/env.js";

export class AppError extends Error {
  constructor(public message: string, public statusCode: number = 400) {
    super(message);
  }
}

export async function createOrder(planId: string, userId: string) {
  const plan = PLANS[planId];
  if (!plan) throw new AppError(`Invalid plan: ${planId}`, 400);

  const order = await getRazorpay().orders.create({
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
  try {
    const body = `${orderId}|${paymentId}`;
    const expectedBuf = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest();
    const sigBuf = Buffer.from(signature, "hex");
    if (expectedBuf.length !== sigBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, sigBuf);
  } catch {
    return false;
  }
}

export async function activateSubscription(
  userId: string,
  planId: string,
  paymentId: string
) {
  const plan = PLANS[planId];
  if (!plan) throw new AppError(`Invalid plan: ${planId}`, 400);

  // Calculate expiry
  const now = Date.now();
  let expiryMs: number;
  if (plan.period === "monthly") {
    expiryMs = now + 30 * 24 * 60 * 60 * 1000;
  } else {
    expiryMs = now + 365 * 24 * 60 * 60 * 1000;
  }

  // Atomic transaction — profile update + payment record succeed or fail together
  await dynamodb.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
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
          },
        },
        {
          Put: {
            TableName: TABLE_NAME,
            Item: {
              PK: `USER#${userId}`,
              SK: `PAYMENT#${paymentId}`,
              plan_id: planId,
              amount: plan.amount,
              currency: plan.currency,
              tier: plan.tier,
              period: plan.period,
              expiry: expiryMs,
              created_at: now,
            },
            // Prevent duplicate payment activation
            ConditionExpression: "attribute_not_exists(PK)",
          },
        },
      ],
    })
  );

  return { status: plan.tier, expiry: expiryMs };
}

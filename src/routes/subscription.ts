import { Router } from "express";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { getUserProfile } from "../services/userService.js";
import { dynamodb, TABLE_NAME } from "../config/dynamodb.js";
import {
  createOrder,
  verifySignature,
  activateSubscription,
} from "../services/subscriptionService.js";
import { ok, fail } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// GET /api/v1/subscription/status
router.get("/status", requireAuth, asyncHandler(async (req, res) => {
  const { uid } = req as AuthRequest;
  const profile = await getUserProfile(uid);

  const status = profile?.subscriptionStatus || "free";
  const expiry = profile?.subscriptionExpiry || null;

  if (status !== "free" && expiry && expiry < Date.now()) {
    // Write expiry back to DB so all consumers see the truth
    await dynamodb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${uid}`, SK: "PROFILE" },
        UpdateExpression:
          "SET subscription_status = :free, updated_at = :now REMOVE subscription_expiry, payment_id, plan_id",
        ExpressionAttributeValues: {
          ":free": "free",
          ":now": Date.now(),
        },
      })
    );
    return ok(res, { status: "free", expiry: null });
  }

  return ok(res, { status, expiry });
}));

// POST /api/v1/subscription/create-order
router.post("/create-order", requireAuth, asyncHandler(async (req, res) => {
  const { uid } = req as AuthRequest;
  const { planId } = req.body;

  if (!planId || typeof planId !== "string") return fail(res, "planId is required");

  const order = await createOrder(planId, uid);
  return ok(res, order);
}));

// POST /api/v1/subscription/verify
router.post("/verify", requireAuth, asyncHandler(async (req, res) => {
  const { uid } = req as AuthRequest;
  const { orderId, paymentId, signature, planId } = req.body;

  if (
    !orderId || typeof orderId !== "string" ||
    !paymentId || typeof paymentId !== "string" ||
    !signature || typeof signature !== "string" ||
    !planId || typeof planId !== "string"
  ) {
    return fail(res, "orderId, paymentId, signature, and planId are required (strings)");
  }

  const isValid = verifySignature(orderId, paymentId, signature);
  if (!isValid) {
    return fail(res, "Invalid payment signature", 400);
  }

  try {
    const result = await activateSubscription(uid, planId, paymentId);
    return ok(res, result);
  } catch (err: unknown) {
    // Duplicate payment replay — ConditionExpression prevents double-activation
    const name = err instanceof Error ? (err as Error & { name: string }).name : "";
    if (name === "TransactionCanceledException") {
      return fail(res, "This payment has already been processed", 409);
    }
    throw err;
  }
}));

export default router;

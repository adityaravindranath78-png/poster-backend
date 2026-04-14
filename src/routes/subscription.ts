import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { getUserProfile } from "../services/userService.js";
import {
  createOrder,
  verifySignature,
  activateSubscription,
} from "../services/subscriptionService.js";
import { ok, fail } from "../utils/response.js";

const router = Router();

// GET /api/v1/subscription/status
router.get("/status", requireAuth, async (req, res, next) => {
  try {
    const { uid } = req as AuthRequest;
    const profile = await getUserProfile(uid);

    const status = profile?.subscriptionStatus || "free";
    const expiry = profile?.subscriptionExpiry || null;

    if (status !== "free" && expiry && expiry < Date.now()) {
      return ok(res, { status: "free", expiry: null });
    }

    return ok(res, { status, expiry });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/subscription/create-order
router.post("/create-order", requireAuth, async (req, res, next) => {
  try {
    const { uid } = req as AuthRequest;
    const { planId } = req.body;

    if (!planId) return fail(res, "planId is required");

    const order = await createOrder(planId, uid);
    return ok(res, order);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/subscription/verify
router.post("/verify", requireAuth, async (req, res, next) => {
  try {
    const { uid } = req as AuthRequest;
    const { orderId, paymentId, signature, planId } = req.body;

    if (!orderId || !paymentId || !signature || !planId) {
      return fail(res, "orderId, paymentId, signature, and planId are required");
    }

    const isValid = verifySignature(orderId, paymentId, signature);
    if (!isValid) {
      return fail(res, "Invalid payment signature", 400);
    }

    const result = await activateSubscription(uid, planId, paymentId);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;

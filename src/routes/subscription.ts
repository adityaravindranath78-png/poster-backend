import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { getUserProfile } from "../services/userService.js";
import { ok } from "../utils/response.js";

const router = Router();

// GET /api/v1/subscription/status
router.get("/status", requireAuth, async (req, res, next) => {
  try {
    const { uid } = req as AuthRequest;
    const profile = await getUserProfile(uid);

    const status = profile?.subscriptionStatus || "free";
    const expiry = profile?.subscriptionExpiry || null;

    // Check if subscription has expired
    if (status !== "free" && expiry && expiry < Date.now()) {
      return ok(res, { status: "free", expiry: null });
    }

    return ok(res, { status, expiry });
  } catch (err) {
    next(err);
  }
});

export default router;

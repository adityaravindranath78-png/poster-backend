import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { getUserProfile, createOrUpdateProfile } from "../services/userService.js";
import { ok, fail } from "../utils/response.js";

const router = Router();

// GET /api/v1/user/profile
router.get("/profile", requireAuth, async (req, res, next) => {
  try {
    const { uid } = req as AuthRequest;
    const profile = await getUserProfile(uid);

    if (!profile) {
      return ok(res, {
        userId: uid,
        name: "",
        language: "en",
        subscriptionStatus: "free",
      });
    }

    return ok(res, profile);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/user/profile
router.put("/profile", requireAuth, async (req, res, next) => {
  try {
    const { uid } = req as AuthRequest;
    const updates = req.body;

    if (!updates || typeof updates !== "object") {
      return fail(res, "Request body must be a JSON object");
    }

    const profile = await createOrUpdateProfile(uid, updates);
    return ok(res, profile);
  } catch (err) {
    next(err);
  }
});

export default router;

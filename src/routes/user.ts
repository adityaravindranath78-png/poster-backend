import { Router } from "express";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { getUserProfile, createOrUpdateProfile } from "../services/userService.js";
import { dynamodb, TABLE_NAME } from "../config/dynamodb.js";
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

// POST /api/v1/user/fcm-token
router.post("/fcm-token", requireAuth, async (req, res, next) => {
  try {
    const { uid } = req as AuthRequest;
    const { token, platform } = req.body;

    if (!token) return fail(res, "token is required");

    await dynamodb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${uid}`, SK: "PROFILE" },
        UpdateExpression:
          "SET fcm_token = :token, fcm_platform = :platform, fcm_updated_at = :now",
        ExpressionAttributeValues: {
          ":token": token,
          ":platform": platform || "unknown",
          ":now": Date.now(),
        },
      })
    );

    return ok(res, { registered: true });
  } catch (err) {
    next(err);
  }
});

export default router;

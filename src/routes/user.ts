import { Router } from "express";
import { z } from "zod";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { getUserProfile, createOrUpdateProfile } from "../services/userService.js";
import { dynamodb, TABLE_NAME } from "../config/dynamodb.js";
import { ok, fail } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const profileUpdateSchema = z
  .object({
    name: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    photoUrl: z.string().url().max(2048).optional(),
    businessName: z.string().max(200).optional(),
    logoUrl: z.string().url().max(2048).optional(),
    language: z
      .enum(["en", "hi", "mr", "gu", "ta", "te", "kn", "ml"])
      .optional(),
  })
  .strict();

// GET /api/v1/user/profile
router.get("/profile", requireAuth, asyncHandler(async (req, res) => {
  const { uid } = req as AuthRequest;
  const profile = await getUserProfile(uid);

  if (!profile) {
    // Return full shape matching UserProfile so the client gets a consistent contract
    return ok(res, {
      userId: uid,
      name: "",
      phone: undefined,
      photoUrl: undefined,
      businessName: undefined,
      logoUrl: undefined,
      language: "en",
      subscriptionStatus: "free",
      subscriptionExpiry: undefined,
    });
  }

  return ok(res, profile);
}));

// PUT /api/v1/user/profile
router.put("/profile", requireAuth, asyncHandler(async (req, res) => {
  const { uid } = req as AuthRequest;
  const parsed = profileUpdateSchema.safeParse(req.body);

  if (!parsed.success) {
    return fail(res, parsed.error.issues[0].message);
  }

  const profile = await createOrUpdateProfile(uid, parsed.data);
  return ok(res, profile);
}));

// POST /api/v1/user/fcm-token
router.post("/fcm-token", requireAuth, asyncHandler(async (req, res) => {
  const { uid } = req as AuthRequest;
  const { token, platform } = req.body;

  if (!token || typeof token !== "string" || token.length > 4096) {
    return fail(res, "Valid FCM token is required (max 4096 chars)");
  }

  const validPlatforms = ["android", "ios", "web"];
  const safePlatform = validPlatforms.includes(platform) ? platform : "unknown";

  await dynamodb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${uid}`, SK: "PROFILE" },
      UpdateExpression:
        "SET fcm_token = :token, fcm_platform = :platform, fcm_updated_at = :now",
      ExpressionAttributeValues: {
        ":token": token,
        ":platform": safePlatform,
        ":now": Date.now(),
      },
    })
  );

  return ok(res, { registered: true });
}));

export default router;

import path from "path";
import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";
import { getPresignedUploadUrl } from "../services/s3Service.js";
import { ok, fail } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_FILENAME_LENGTH = 200;

// POST /api/v1/upload/presigned-url
router.post("/presigned-url", requireAuth, uploadLimiter, asyncHandler(async (req, res) => {
  const { uid } = req as AuthRequest;
  const { filename, contentType } = req.body;

  if (!filename || typeof filename !== "string" || !contentType) {
    return fail(res, "filename and contentType are required");
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return fail(res, `Content type not allowed. Use: ${ALLOWED_TYPES.join(", ")}`);
  }

  if (filename.length > MAX_FILENAME_LENGTH) {
    return fail(res, "Filename too long");
  }

  // Sanitize filename — strip path traversal, allow only safe characters
  const sanitized = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!sanitized || sanitized.startsWith(".")) {
    return fail(res, "Invalid filename");
  }

  // Prefix with user ID for isolation + timestamp for uniqueness
  const key = `uploads/${uid}/${Date.now()}_${sanitized}`;
  const result = await getPresignedUploadUrl(key, contentType);

  return ok(res, result);
}));

export default router;

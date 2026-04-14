import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";
import { getPresignedUploadUrl } from "../services/s3Service.js";
import { ok, fail } from "../utils/response.js";

const router = Router();

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_FILENAME_LENGTH = 200;

// POST /api/v1/upload/presigned-url
router.post("/presigned-url", requireAuth, uploadLimiter, async (req, res, next) => {
  try {
    const { uid } = req as AuthRequest;
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      return fail(res, "filename and contentType are required");
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return fail(res, `Content type not allowed. Use: ${ALLOWED_TYPES.join(", ")}`);
    }

    if (filename.length > MAX_FILENAME_LENGTH) {
      return fail(res, "Filename too long");
    }

    // Prefix with user ID for isolation
    const key = `uploads/${uid}/${filename}`;
    const result = await getPresignedUploadUrl(key, contentType);

    return ok(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;

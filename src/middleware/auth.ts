import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export interface AuthRequest extends Request {
  uid: string;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, data: null, error: "Missing auth token" });
  }

  const token = header.slice(7);

  // In development without Firebase Admin creds, extract UID from the JWT payload
  // Firebase ID tokens are JWTs — the payload contains { sub: uid }
  if (
    env.NODE_ENV === "development" &&
    !env.FIREBASE_PRIVATE_KEY &&
    !env.GOOGLE_APPLICATION_CREDENTIALS
  ) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], "base64url").toString()
        );
        (req as AuthRequest).uid = payload.sub || payload.user_id || "dev_user";
        return next();
      }
    } catch {}
    // Fallback: use a dev UID
    (req as AuthRequest).uid = "dev_user";
    return next();
  }

  // Production: verify with Firebase Admin
  try {
    const { firebaseAuth } = await import("../config/firebase.js");
    const decoded = await firebaseAuth.verifyIdToken(token);
    (req as AuthRequest).uid = decoded.uid;
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, data: null, error: "Invalid or expired token" });
  }
}

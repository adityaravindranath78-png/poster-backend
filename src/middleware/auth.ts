import { Request, Response, NextFunction } from "express";
import { firebaseAuth } from "../config/firebase.js";

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

  try {
    const decoded = await firebaseAuth.verifyIdToken(token);
    (req as AuthRequest).uid = decoded.uid;
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, data: null, error: "Invalid or expired token" });
  }
}

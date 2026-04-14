import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export function errorHandler(
  err: Error & { statusCode?: number },
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = (req as Request & { requestId?: string }).requestId || "unknown";
  const statusCode = err.statusCode || 500;

  // Only log stack traces for unexpected errors
  if (statusCode >= 500) {
    console.error(`[ERROR] [${requestId}]`, err.message, env.NODE_ENV === "development" ? err.stack : "");
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    error: statusCode >= 500 && env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
    requestId,
  });
}

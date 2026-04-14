import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("[ERROR]", err.message, env.NODE_ENV === "development" ? err.stack : "");

  res.status(500).json({
    success: false,
    data: null,
    error: env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
}

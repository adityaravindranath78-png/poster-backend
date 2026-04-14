import crypto from "crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import userRoutes from "./routes/user.js";
import templateRoutes from "./routes/templates.js";
import uploadRoutes from "./routes/upload.js";
import subscriptionRoutes from "./routes/subscription.js";

// Startup validation
if (env.NODE_ENV === "production") {
  const missing: string[] = [];
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) missing.push("RAZORPAY_KEY_ID/SECRET");
  if (!env.CLOUDFRONT_DOMAIN) missing.push("CLOUDFRONT_DOMAIN");
  if (missing.length) {
    console.error(`[FATAL] Missing required config: ${missing.join(", ")}`);
    process.exit(1);
  }
}

const app = express();

// Global middleware
app.use(helmet());
app.use(
  cors({
    origin:
      env.NODE_ENV === "production"
        ? env.ADMIN_ORIGIN
          ? [env.ADMIN_ORIGIN]
          : false
        : true,
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));

// Attach request ID for log correlation
app.use((req, _res, next) => {
  (req as express.Request & { requestId: string }).requestId = crypto.randomUUID();
  next();
});

app.use("/api/v1", apiLimiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/templates", templateRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/subscription", subscriptionRoutes);

// Error handler (must be last)
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`[poster-backend] running on port ${env.PORT} (${env.NODE_ENV})`);
});

// Graceful shutdown — let in-flight requests finish before dying
process.on("SIGTERM", () => {
  console.log("[poster-backend] SIGTERM received, shutting down gracefully");
  server.close(() => process.exit(0));
});

export default app;

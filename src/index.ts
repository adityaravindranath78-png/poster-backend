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

const app = express();

// Global middleware
app.use(helmet());
app.use(
  cors({
    origin: env.NODE_ENV === "production" ? [] : "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
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

app.listen(env.PORT, () => {
  console.log(`[poster-backend] running on port ${env.PORT} (${env.NODE_ENV})`);
});

export default app;

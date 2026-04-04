import cors from "cors";
import express from "express";
import morgan from "morgan";
import { ensureDatabaseConnection } from "./config/db.js";
import analysisRoutes from "./routes/analysisRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import plannerRoutes from "./routes/plannerRoutes.js";
import questRoutes from "./routes/questRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import habitRoutes from "./routes/habitRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";
import emotionRoutes from "./routes/emotionRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";

const app = express();
const allowedOrigins = new Set(
  String(process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.size === 0 || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.send("API is running");
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/chatbot", chatbotRoutes);

app.use("/api", async (req, res, next) => {
  if (req.path === "/health") {
    next();
    return;
  }

  try {
    await ensureDatabaseConnection();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/quests", questRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/emotions", emotionRoutes);
app.use("/api", (_req, res) => {
  res.status(404).json({
    message: "API route not found."
  });
});

app.use((error, _req, res, _next) => {
  const isDatabaseUnavailable =
    error?.name === "MongooseServerSelectionError" ||
    /ECONNREFUSED 127\.0\.0\.1:27017/i.test(error?.message || "") ||
    /MongoDB is not running/i.test(error?.message || "") ||
    /did not become ready on 127\.0\.0\.1:27017/i.test(error?.message || "");

  const status = isDatabaseUnavailable ? 503 : error.status || 500;
  const message = isDatabaseUnavailable
    ? "Database unavailable. Start MongoDB and restart the backend, or set a valid MONGODB_URI."
    : error.message || "Something went wrong.";

  res.status(status).json({
    message,
    ...(typeof error.remainingAttempts === "number" ? { remainingAttempts: error.remainingAttempts } : {})
  });
});

export default app;

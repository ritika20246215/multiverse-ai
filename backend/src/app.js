import cors from "cors";
import express from "express";
import morgan from "morgan";
import analysisRoutes from "./routes/analysisRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import guildRoutes from "./routes/guildRoutes.js";
import questRoutes from "./routes/questRoutes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/quests", questRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/guilds", guildRoutes);

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  res.status(status).json({
    message: error.message || "Something went wrong."
  });
});

export default app;

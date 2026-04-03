require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const Task = require("./models/Task");

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/task-management-system";
const publicDir = path.join(__dirname, "public");

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(express.static(publicDir));

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeTaskPayload = (payload, { partial = false } = {}) => {
  const next = {};

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "title")) {
    const title = normalizeString(payload.title);
    if (!title) {
      const error = new Error("Task title is required.");
      error.status = 400;
      throw error;
    }
    next.title = title;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "description")) {
    next.description = typeof payload.description === "string" ? payload.description.trim() : "";
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "priority")) {
    const priority = payload.priority ?? "medium";
    if (!["high", "medium", "low"].includes(priority)) {
      const error = new Error("Priority must be high, medium, or low.");
      error.status = 400;
      throw error;
    }
    next.priority = priority;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "completed")) {
    if (payload.completed !== undefined && typeof payload.completed !== "boolean") {
      const error = new Error("Completed must be a boolean.");
      error.status = 400;
      throw error;
    }
    next.completed = Boolean(payload.completed);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "dueDate")) {
    if (payload.dueDate === null || payload.dueDate === "" || payload.dueDate === undefined) {
      next.dueDate = null;
    } else {
      const dueDate = new Date(payload.dueDate);
      if (Number.isNaN(dueDate.getTime())) {
        const error = new Error("Due date must be a valid date.");
        error.status = 400;
        throw error;
      }
      next.dueDate = dueDate;
    }
  }

  return next;
};

const reorderSequentially = async () => {
  const tasks = await Task.find().sort({ order: 1, createdAt: 1, _id: 1 });
  await Promise.all(
    tasks.map((task, index) => {
      if (task.order === index) {
        return Promise.resolve();
      }
      task.order = index;
      return task.save();
    })
  );
  return Task.find().sort({ order: 1, createdAt: 1, _id: 1 });
};

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.get("/api/tasks", async (_req, res, next) => {
  try {
    const tasks = await Task.find().sort({ order: 1, createdAt: 1, _id: 1 });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

app.post("/api/tasks", async (req, res, next) => {
  try {
    const nextTask = normalizeTaskPayload(req.body || {});
    const latestTask = await Task.findOne().sort({ order: -1, createdAt: -1 });
    const task = await Task.create({
      ...nextTask,
      order: latestTask ? latestTask.order + 1 : 0
    });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

app.put("/api/tasks/reorder", async (req, res, next) => {
  try {
    const tasks = Array.isArray(req.body?.tasks) ? req.body.tasks : null;

    if (!tasks) {
      const error = new Error("A tasks array is required for reordering.");
      error.status = 400;
      throw error;
    }

    const existingTasks = await Task.find().select("_id");
    const existingIds = new Set(existingTasks.map((task) => String(task._id)));
    const incomingIds = tasks.map((task) => String(task.id || task._id || ""));

    if (incomingIds.some((id) => !existingIds.has(id))) {
      const error = new Error("Reorder payload contains invalid task IDs.");
      error.status = 400;
      throw error;
    }

    await Promise.all(
      incomingIds.map((id, index) =>
        Task.findByIdAndUpdate(id, { order: index }, { new: false, runValidators: false })
      )
    );

    const reorderedTasks = await Task.find().sort({ order: 1, createdAt: 1, _id: 1 });
    res.json(reorderedTasks);
  } catch (error) {
    next(error);
  }
});

app.put("/api/tasks/:id", async (req, res, next) => {
  try {
    const updates = normalizeTaskPayload(req.body || {}, { partial: true });
    const task = await Task.findById(req.params.id);

    if (!task) {
      const error = new Error("Task not found.");
      error.status = 404;
      throw error;
    }

    Object.assign(task, updates);
    await task.save();

    res.json(task);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/tasks/:id", async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      const error = new Error("Task not found.");
      error.status = 404;
      throw error;
    }

    const tasks = await reorderSequentially();
    res.json({
      message: "Task deleted successfully.",
      tasks
    });
  } catch (error) {
    next(error);
  }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    const error = new Error("API route not found.");
    error.status = 404;
    return next(error);
  }

  return res.sendFile(path.join(publicDir, "index.html"));
});

app.use((error, _req, res, _next) => {
  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: "Invalid task ID." });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const firstMessage = Object.values(error.errors)[0]?.message || "Validation failed.";
    return res.status(400).json({ message: firstMessage });
  }

  const status = error.status || 500;
  const message = status >= 500 ? "Something went wrong on the server." : error.message;
  if (status >= 500) {
    console.error(error);
  }
  return res.status(status).json({ message });
});

const start = async () => {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB connected at ${mongoose.connection.host}`);

    app.listen(PORT, () => {
      console.log(`Task Management System running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB.", error.message);
    process.exit(1);
  }
};

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error.message);
});

start();

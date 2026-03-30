import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const backendEnvPath = path.join(rootDir, "backend", ".env");
const frontendEnvPath = path.join(rootDir, "frontend", ".env");

dotenv.config({ path: backendEnvPath });
dotenv.config({ path: frontendEnvPath });

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m"
};

const results = [];

const printResult = (status, label, detail) => {
  const palette =
    status === "PASS" ? colors.green : status === "WARN" ? colors.yellow : colors.red;
  console.log(`${palette}${status.padEnd(5)}${colors.reset} ${label} ${detail ? `- ${detail}` : ""}`);
};

const addResult = (status, label, detail = "") => {
  results.push({ status, label, detail });
  printResult(status, label, detail);
};

const parseBaseUrl = (value) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const safeFetchJson = async (url, options = {}, timeoutMs = 10000) => {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs)
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  return {
    ok: response.ok,
    status: response.status,
    body
  };
};

const requiredBackendEnv = [
  "MONGODB_URI",
  "JWT_SECRET",
  "ML_API_URL",
  "GROQ_API_KEY",
  "GROQ_API_URL",
  "GROQ_MODEL",
  "GROQ_FALLBACK_MODEL"
];

const requiredFrontendEnv = ["VITE_API_URL"];

const checkEnvFiles = () => {
  if (!fs.existsSync(backendEnvPath)) {
    addResult("FAIL", "backend/.env", "Missing backend environment file.");
    return false;
  }

  addResult("PASS", "backend/.env", "Found backend environment file.");

  if (!fs.existsSync(frontendEnvPath)) {
    addResult("FAIL", "frontend/.env", "Missing frontend environment file.");
    return false;
  }

  addResult("PASS", "frontend/.env", "Found frontend environment file.");
  return true;
};

const checkEnvValues = () => {
  requiredBackendEnv.forEach((key) => {
    if (process.env[key]) {
      addResult("PASS", `env:${key}`, "Configured.");
    } else {
      addResult("FAIL", `env:${key}`, "Missing value.");
    }
  });

  requiredFrontendEnv.forEach((key) => {
    if (process.env[key]) {
      addResult("PASS", `env:${key}`, "Configured.");
    } else {
      addResult("FAIL", `env:${key}`, "Missing value.");
    }
  });
};

const checkMongo = async () => {
  if (!process.env.MONGODB_URI) {
    addResult("FAIL", "MongoDB", "MONGODB_URI is missing.");
    return;
  }

  try {
    const connection = await mongoose.createConnection(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000
    }).asPromise();

    addResult("PASS", "MongoDB", `Connected to ${connection.name}.`);
    await connection.close();
  } catch (error) {
    addResult("FAIL", "MongoDB", error.message);
  }
};

const checkMlApi = async () => {
  const mlUrl = process.env.ML_API_URL;
  if (!mlUrl || !parseBaseUrl(mlUrl)) {
    addResult("FAIL", "ML API", "ML_API_URL is invalid.");
    return;
  }

  try {
    const health = await safeFetchJson(`${mlUrl}/health`);
    if (!health.ok) {
      addResult("FAIL", "ML API health", `HTTP ${health.status}`);
      return;
    }

    addResult("PASS", "ML API health", "Health endpoint responded.");

    const sample = await safeFetchJson(
      `${mlUrl}/predict`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_hours: 6,
          sleep_hours: 7.5,
          exercise: 1,
          screen_time: 3,
          consistency: 8,
          procrastination: 3,
          goal_clarity: 9
        })
      },
      15000
    );

    if (sample.ok && sample.body?.prediction) {
      addResult("PASS", "ML API predict", `Sample prediction: ${sample.body.prediction}`);
    } else {
      addResult("FAIL", "ML API predict", `HTTP ${sample.status}`);
    }
  } catch (error) {
    addResult("FAIL", "ML API", error.message);
  }
};

const checkGroq = async () => {
  const groqUrl = process.env.GROQ_API_URL;
  const modelName = process.env.GROQ_MODEL;
  const fallbackModelName = process.env.GROQ_FALLBACK_MODEL;

  if (!groqUrl || !parseBaseUrl(groqUrl)) {
    addResult("FAIL", "Groq", "GROQ_API_URL is invalid.");
    return;
  }

  try {
    const models = await safeFetchJson(
      `${groqUrl}/models`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      },
      15000
    );

    if (!models.ok) {
      addResult("FAIL", "Groq models", `HTTP ${models.status}`);
      return;
    }

    const available = models.body?.data || [];
    const hasModel = available.some((model) => model.id === modelName);
    const hasFallbackModel = available.some((model) => model.id === fallbackModelName);

    if (!hasModel) {
      addResult("FAIL", "Groq model", `Model '${modelName}' is not available on this API key.`);
      return;
    }

    addResult("PASS", "Groq model", `Found model '${modelName}'.`);
    if (hasFallbackModel) {
      addResult("PASS", "Groq fallback model", `Found fallback model '${fallbackModelName}'.`);
    } else {
      addResult("WARN", "Groq fallback model", `Fallback model '${fallbackModelName}' is not available on this API key.`);
    }

    const completion = await safeFetchJson(
      `${groqUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelName,
          temperature: 0,
          messages: [
            {
              role: "user",
              content: "Reply with exactly READY"
            }
          ]
        })
      },
      60000
    );

    const content = completion.body?.choices?.[0]?.message?.content;
    if (completion.ok && typeof content === "string") {
      addResult("PASS", "Groq generate", content.trim().slice(0, 60));
    } else {
      addResult("FAIL", "Groq generate", `HTTP ${completion.status}`);
    }
  } catch (error) {
    addResult("FAIL", "Groq", error.message);
  }
};

const checkOptionalApp = async (label, url) => {
  try {
    const response = await safeFetchJson(url, {}, 8000);
    if (response.ok) {
      addResult("PASS", label, "Already running.");
    } else {
      addResult("WARN", label, `Reachable but returned HTTP ${response.status}.`);
    }
  } catch (_error) {
    addResult("WARN", label, "Not running yet.");
  }
};

const summarize = () => {
  const hardFailures = results.filter((result) => result.status === "FAIL");
  const warnings = results.filter((result) => result.status === "WARN");

  console.log(`\n${colors.cyan}Summary${colors.reset}`);
  console.log(`Checks: ${results.length}`);
  console.log(`Failures: ${hardFailures.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (hardFailures.length) {
    process.exitCode = 1;
  }
};

const run = async () => {
  console.log(`${colors.cyan}Parallel You Local Smoke Test${colors.reset}\n`);

  checkEnvFiles();
  checkEnvValues();
  await checkMongo();
  await checkMlApi();
  await checkGroq();
  await checkOptionalApp("Backend app", "http://127.0.0.1:5000/api/health");
  await checkOptionalApp("Frontend app", "http://127.0.0.1:5173");
  summarize();
};

run().catch((error) => {
  addResult("FAIL", "Smoke test runner", error.message);
  summarize();
});

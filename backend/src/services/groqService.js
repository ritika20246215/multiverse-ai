const groqApiUrl = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1";
const primaryGroqModel = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const fallbackGroqModel = process.env.GROQ_FALLBACK_MODEL || "llama-3.1-8b-instant";

const extractJson = (text) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Groq returned an invalid JSON payload.");
  }

  return JSON.parse(text.slice(start, end + 1));
};

export const generateSimulationNarrative = async ({ name, goals, habits, behaviorProfile, prediction, probabilities }) => {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error("GROQ_API_KEY is missing.");
    error.status = 500;
    throw error;
  }

  const messages = [
    {
      role: "system",
      content:
        "You are the narrative engine for a personal future simulation platform. Respect the machine-learning prediction as ground truth. Return only valid JSON."
    },
    {
      role: "user",
      content: `Return JSON with this exact shape:
{
  "personalityType": "string",
  "summary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "futureStory": "string",
  "alternateStory": "string",
  "futureMessage": "string",
  "dailyTasks": [
    {
      "title": "string",
      "description": "string",
      "difficulty": "Easy" | "Medium" | "Hard"
    }
  ]
}

Rules:
- strengths: exactly 3 items
- weaknesses: exactly 3 items
- dailyTasks: exactly 3 items
- futureStory = optimistic future path
- alternateStory = cautionary future path
- Keep it hackathon-demo friendly, practical, and motivating

User data:
${JSON.stringify({ name, goals, habits, behaviorProfile, prediction, probabilities }, null, 2)}`
    }
  ];

  const modelsToTry = Array.from(new Set([primaryGroqModel, fallbackGroqModel].filter(Boolean)));
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch(`${groqApiUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          messages
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `Groq generation failed for model ${model}.`);
      }

      const content = data.choices?.[0]?.message?.content || "";
      const parsed = extractJson(content);
      return {
        ...parsed,
        modelUsed: model
      };
    } catch (error) {
      lastError = error;
    }
  }

  lastError.status = 502;
  throw lastError;
};

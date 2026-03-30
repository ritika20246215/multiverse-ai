const mlApiUrl = process.env.ML_API_URL || "http://127.0.0.1:8000";

export const predictFutureOutcome = async (features) => {
  const response = await fetch(`${mlApiUrl}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(features)
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.detail || "ML prediction failed.");
    error.status = 502;
    throw error;
  }

  return data;
};

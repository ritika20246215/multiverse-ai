const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const request = async (path, { method = "GET", token, body } = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
};

export const api = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/auth/me", { token }),
  analyzeUser: (token, payload) => request("/analysis/analyze-user", { method: "POST", token, body: payload }),
  getDashboard: (token) => request("/dashboard", { token }),
  generateQuests: (token) => request("/quests/generate", { method: "POST", token }),
  completeQuest: (token, questId) => request(`/quests/${questId}/complete`, { method: "PATCH", token }),
  getGuilds: (token) => request("/guilds", { token }),
  createGuild: (token, payload) => request("/guilds", { method: "POST", token, body: payload }),
  joinGuild: (token, guildId) => request(`/guilds/${guildId}/join`, { method: "POST", token })
};

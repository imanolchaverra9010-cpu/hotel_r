function getApiBaseUrl(): string {
  const env = (import.meta.env.VITE_API_URL ?? "").toString().replace(/\/+$/, "");
  if (env) return env;
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:8000";
  }
  return "https://hotel-hub-main.vercel.app";
}
export const API_BASE_URL = getApiBaseUrl();


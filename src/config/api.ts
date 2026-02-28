const PRODUCTION_API = "hotel-hub-main.vercel.app";

function getApiBase(): string {
  const env = (import.meta.env.VITE_API_BASE ?? "").toString().replace(/\/+$/, "");
  if (env) return env;

  if (typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
    return PRODUCTION_API;
  }

  return "http://localhost:8000";
}

export const API_BASE = getApiBase();

export function apiUrl(path: string) {
  const p = (path || "").startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}


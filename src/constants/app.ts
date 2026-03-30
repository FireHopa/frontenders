export const APP_NAME = "Autoridade ORI";

export const ROUTES = {
  home: "/",
  // journey: "/journey",
  // dashboard: "/dashboard",
} as const;

function normalizeApiBaseUrl(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/$/, "");
}

function inferApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return "http://localhost:8000";
  }

  const { protocol, hostname } = window.location;
  const nextProtocol = protocol === "https:" ? "https:" : "http:";
  return `${nextProtocol}//${hostname}:8000`;
}

export const API_BASE_URL =
  normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL) ?? inferApiBaseUrl();

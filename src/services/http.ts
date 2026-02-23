import { API_BASE_URL } from "@/constants/app";

export class HttpError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
  }
}

type RequestInitWithJson = RequestInit & { json?: unknown };

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function http<T>(path: string, init: RequestInitWithJson = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(init.headers);

  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });

  if (!res.ok) {
    const payload = await parseJsonSafe(res);
    const message =
      (payload && typeof payload === "object" && "detail" in payload && String((payload as any).detail)) ||
      `HTTP ${res.status}`;
    throw new HttpError(message, res.status, payload);
  }

  const payload = await parseJsonSafe(res);
  return payload as T;
}

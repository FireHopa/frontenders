export type ImageHistoryMode = "generated" | "edited";

export type ImageHistoryItem = {
  id: string;
  type: ImageHistoryMode;
  url: string;
  motor: string;
  engine_id: string;
  format: string;
  quality: string;
  createdAt: string;
  width?: number;
  height?: number;
  prompt?: string;
  improvedPrompt?: string;
};

const STORAGE_KEY = "image-engine-history-v1";
const MAX_ITEMS = 120;

export function readImageHistory(): ImageHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeImageHistory(items: ImageHistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export function appendImageHistory(items: Omit<ImageHistoryItem, "id" | "createdAt">[]) {
  if (!items.length || typeof window === "undefined") return;
  const current = readImageHistory();
  const next: ImageHistoryItem[] = items.map((item) => ({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
  }));
  writeImageHistory([...next, ...current]);
}

export async function downloadImage(url: string, filename: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export function formatHistoryMode(type: ImageHistoryMode) {
  return type === "generated" ? "Gerada do zero" : "Editada por referência";
}

export function formatLabel(value: string, map: Record<string, string>) {
  return map[value] || value;
}

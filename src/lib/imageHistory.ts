export type ImageHistoryMode = "generated" | "edited";

export type ImageHistoryItem = {
  id: string;
  type: ImageHistoryMode;
  url: string;
  thumbnailUrl?: string;  // small 120px thumbnail stored in localStorage
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
const MAX_ITEMS = 60;
const THUMB_SIZE = 120; // px — max dimension for localStorage thumbnail

/** Downsample a data-URI to a tiny JPEG thumbnail using an offscreen canvas. */
async function _makeThumb(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = THUMB_SIZE / Math.max(img.naturalWidth, img.naturalHeight, 1);
          const w = Math.round(img.naturalWidth * scale);
          const h = Math.round(img.naturalHeight * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { resolve(""); return; }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.55));
        } catch {
          resolve("");
        }
      };
      img.onerror = () => resolve("");
      img.src = dataUrl;
    } catch {
      resolve("");
    }
  });
}

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
  // Never store full data-URIs — keep only thumbnailUrl for display
  const safe = items.slice(0, MAX_ITEMS).map((item) => ({
    ...item,
    url: item.url?.startsWith("data:") ? "" : item.url, // strip full data-uri
  }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  } catch (e) {
    // If still quota error, drop oldest half and retry once
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safe.slice(0, Math.floor(safe.length / 2))));
    } catch {
      // give up silently — history is non-critical
    }
  }
}

export async function appendImageHistory(items: Omit<ImageHistoryItem, "id" | "createdAt">[]) {
  if (!items.length || typeof window === "undefined") return;
  const current = readImageHistory();
  const next: ImageHistoryItem[] = await Promise.all(
    items.map(async (item) => {
      const thumbnailUrl = item.url?.startsWith("data:")
        ? await _makeThumb(item.url)
        : item.url;
      return {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        createdAt: new Date().toISOString(),
        thumbnailUrl,
      };
    })
  );
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

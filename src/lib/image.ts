export async function fileToResizedDataUrl(
  file: File,
  opts?: { maxSize?: number; mime?: "image/webp" | "image/png" | "image/jpeg"; quality?: number }
): Promise<string> {
  const maxSize = opts?.maxSize ?? 256;
  const mime = opts?.mime ?? "image/webp";
  const quality = opts?.quality ?? 0.9;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = URL.createObjectURL(file);
  });

  try {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    const scale = Math.min(1, maxSize / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível");

    ctx.drawImage(img, 0, 0, tw, th);

    const dataUrl = canvas.toDataURL(mime, quality);
    return dataUrl;
  } finally {
    // revoke object url
    try {
      URL.revokeObjectURL((img as any).src);
    } catch {}
  }
}

/**
 * Bill sharing: render a DOM node to PNG or PDF and hand it to the native
 * share sheet (WhatsApp / SMS / anything installed). Fully offline.
 */

function isNative(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Boolean((window as any).Capacitor?.isNativePlatform?.());
}

async function nodeToCanvas(node: HTMLElement) {
  const { default: html2canvas } = await import("html2canvas");
  return html2canvas(node, {
    backgroundColor: "#ffffff",
    scale: Math.min(3, Math.max(2, window.devicePixelRatio || 2)),
    useCORS: true,
  });
}

function stripDataUrl(dataUrl: string) {
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

async function shareBase64(base64: string, fileName: string, mime: string, title: string) {
  if (isNative()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
    await Share.share({ title, text: title, files: [uri] });
    return;
  }
  // Web fallback: download the file so the flow is testable in the browser.
  const link = document.createElement("a");
  link.href = `data:${mime};base64,${base64}`;
  link.download = fileName;
  link.click();
}

export async function shareNodeAsImage(
  node: HTMLElement,
  fileName: string,
  title: string,
  format: "png" | "jpeg" = "jpeg",
) {
  const canvas = await nodeToCanvas(node);
  const mime = format === "png" ? "image/png" : "image/jpeg";
  const ext = format === "png" ? "png" : "jpg";
  const dataUrl = format === "png" ? canvas.toDataURL(mime) : canvas.toDataURL(mime, 0.92);
  await shareBase64(stripDataUrl(dataUrl), `${fileName}.${ext}`, mime, title);
}


/** Opens WhatsApp with a prefilled message; falls back to SMS. */
export async function shareText(text: string, phone?: string) {
  if (isNative()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({ text });
      return;
    } catch {
      /* fall through */
    }
  }
  const target = phone
    ? `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(target, "_blank");
}

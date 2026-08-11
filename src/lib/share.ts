import { withNativeActivity } from "./native-activity";

/**
 * Bill sharing: render a DOM node to PNG or PDF and hand it to the native
 * share sheet (WhatsApp / SMS / anything installed). Fully offline.
 */

function isNative(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Boolean((window as any).Capacitor?.isNativePlatform?.());
}

/**
 * Renders a node to a canvas. Uses html-to-image (SVG foreignObject) because
 * html2canvas cannot parse modern `oklch()` colors used by the theme.
 *
 * The rasterised PNG is re-drawn onto a fresh canvas with an identity
 * transform: some Android WebViews hand back a flipped/mirrored bitmap when
 * the foreignObject image is decoded, and re-drawing normalises orientation.
 */
async function nodeToCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  const { toPng } = await import("html-to-image");
  const pixelRatio = Math.min(3, Math.max(2, window.devicePixelRatio || 2));
  const options = {
    backgroundColor: "#ffffff",
    pixelRatio,
    cacheBust: true,
    width: node.offsetWidth,
    height: node.offsetHeight,
  } as const;

  // Fonts are self-hosted, so they can be inlined into the exported image and
  // the bill looks exactly like it does on screen. If inlining ever fails
  // (font fetch blocked), fall back to skipping fonts rather than losing the
  // share entirely — the layout survives either way.
  let dataUrl: string;
  try {
    dataUrl = await toPng(node, { ...options, skipFonts: false });
  } catch (err) {
    console.warn("font inlining failed, exporting without embedded fonts", err);
    dataUrl = await toPng(node, { ...options, skipFonts: true });
  }


  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("bill image decode failed"));
    el.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || Math.round(node.offsetWidth * pixelRatio);
  canvas.height = img.naturalHeight || Math.round(node.offsetHeight * pixelRatio);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.setTransform(1, 0, 0, 1, 0, 0); // never inherit a flipped transform
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
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
    await withNativeActivity(() => Share.share({ title, text: title, files: [uri] }));
    return;
  }
  // Web fallback: download via a blob URL (data: URLs can navigate instead).
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
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
      await withNativeActivity(() => Share.share({ text }));
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

/**
 * Renders a DOM node into a (multi-page) A4 PDF and hands it to the share
 * sheet on native, or downloads it on web.
 */
export async function shareNodeAsPdf(node: HTMLElement, fileName: string, title: string) {
  const canvas = await nodeToCanvas(node);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width;
  const img = canvas.toDataURL("image/jpeg", 0.92);

  if (imgH <= pageH - margin * 2) {
    pdf.addImage(img, "JPEG", margin, margin, imgW, imgH);
  } else {
    // Slice the tall canvas into page-sized chunks.
    const pxPerPage = Math.floor(((pageH - margin * 2) * canvas.width) / imgW);
    let y = 0;
    let first = true;
    while (y < canvas.height) {
      const sliceH = Math.min(pxPerPage, canvas.height - y);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceH;
      const ctx = slice.getContext("2d");
      if (!ctx) break;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      if (!first) pdf.addPage();
      pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, imgW, (sliceH * imgW) / canvas.width);
      first = false;
      y += sliceH;
    }
  }

  const base64 = stripDataUrl(pdf.output("datauristring"));
  await shareBase64(base64, `${fileName}.pdf`, "application/pdf", title);
}

/**
 * Saves a text document (backup JSON) as a real file the user can find outside
 * the app: on Android it lands in the shared Documents folder and the share
 * sheet opens so it can be moved to Drive/WhatsApp/Files. On web it downloads.
 * Returns a human-readable location for the success toast.
 */
export async function saveTextFile(
  fileName: string,
  text: string,
  mime: string,
  title: string,
): Promise<string> {
  if (isNative()) {
    const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    let directory = Directory.Documents;
    try {
      await Filesystem.writeFile({ path: fileName, data: text, directory, encoding: Encoding.UTF8 });
    } catch {
      // Some OEM builds refuse Documents; External is always writable.
      directory = Directory.External;
      await Filesystem.writeFile({ path: fileName, data: text, directory, encoding: Encoding.UTF8 });
    }
    const { uri } = await Filesystem.getUri({ path: fileName, directory });
    try {
      await withNativeActivity(() => Share.share({ title, text: title, files: [uri] }));
    } catch {
      /* user dismissed the sheet — the file is already saved */
    }
    return uri.replace(/^file:\/\//, "");
  }

  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return fileName;
}

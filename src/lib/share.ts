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
 */
async function nodeToCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  const { toCanvas } = await import("html-to-image");
  return toCanvas(node, {
    backgroundColor: "#ffffff",
    pixelRatio: Math.min(3, Math.max(2, window.devicePixelRatio || 2)),
    cacheBust: true,
    skipFonts: true,
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

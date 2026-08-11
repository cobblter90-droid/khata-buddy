import { API_BASE, APP_VERSION, PRODUCT_KEY } from "./constants";

export type UpdateInfo = {
  latestVersion: string;
  downloadUrl: string | null;
};

/** Numeric, part-by-part semver compare. Returns >0 when a > b. */
export function compareVersions(a: string, b: string): number {
  const pa = String(a).trim().replace(/^v/i, "").split(/[.\-+]/);
  const pb = String(b).trim().replace(/^v/i, "").split(/[.\-+]/);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const na = parseInt(pa[i] ?? "0", 10) || 0;
    const nb = parseInt(pb[i] ?? "0", 10) || 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}

export const APP_VERSION_URL = `${API_BASE}/api/public/v1/app-version?product_key=${PRODUCT_KEY}&platform=mobile&client_version=${APP_VERSION}`;

/** Returns update info only when the server version is strictly newer. */
export async function checkAppVersion(): Promise<UpdateInfo | null> {
  try {
    const res = await fetch(APP_VERSION_URL, { headers: { Accept: "application/json" } });
    const payload = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    const latestVersion = String(
      payload?.["latest_version"] ?? payload?.["version"] ?? payload?.["latestVersion"] ?? "",
    ).trim();
    const downloadUrl =
      typeof payload?.["download_url"] === "string"
        ? (payload["download_url"] as string)
        : typeof payload?.["downloadUrl"] === "string"
          ? (payload["downloadUrl"] as string)
          : null;

    const cmp = latestVersion ? compareVersions(latestVersion, APP_VERSION) : 0;
    // Temporary diagnostic log so the comparison can be verified on a real device.
    console.log(
      `[update-check] url=${APP_VERSION_URL} status=${res.status} installed=${APP_VERSION} latest=${latestVersion || "(none)"} compare=${cmp} showBanner=${cmp > 0}`,
    );

    if (!latestVersion || cmp <= 0) return null;
    return { latestVersion, downloadUrl };
  } catch (err) {
    console.log("[update-check] failed", err);
    return null;
  }
}

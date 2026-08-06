import { Preferences } from "@capacitor/preferences";

import { API_BASE, APP_VERSION, PRODUCT_KEY } from "./constants";

export type LicenseStatus = "active" | "locked" | "not_found" | "offline" | "unknown";

const KEY_LICENSE = "assan_khata_license_key";
const KEY_DEVICE = "assan_khata_device_id";
const KEY_LAST_STATUS = "assan_khata_last_status";

async function prefGet(key: string): Promise<string | null> {
  try {
    const { value } = await Preferences.get({ key });
    return value ?? null;
  } catch {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  }
}

async function prefSet(key: string, value: string) {
  try {
    await Preferences.set({ key, value });
  } catch {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  }
}

async function prefRemove(key: string) {
  try {
    await Preferences.remove({ key });
  } catch {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  }
}

export const getStoredLicenseKey = () => prefGet(KEY_LICENSE);
export const storeLicenseKey = (key: string) => prefSet(KEY_LICENSE, key);
export const clearLicenseKey = () => prefRemove(KEY_LICENSE);
export const getLastStatus = () => prefGet(KEY_LAST_STATUS) as Promise<LicenseStatus | null>;
export const setLastStatus = (s: LicenseStatus) => prefSet(KEY_LAST_STATUS, s);

function randomId() {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getDeviceId(): Promise<string> {
  const existing = await prefGet(KEY_DEVICE);
  if (existing) return existing;
  let id = randomId();
  try {
    const { Device } = await import("@capacitor/device");
    const info = await Device.getId();
    if (info?.identifier) id = info.identifier;
  } catch {
    /* web fallback keeps the random id */
  }
  await prefSet(KEY_DEVICE, id);
  return id;
}

async function getDeviceMeta() {
  let device_type = "web";
  let device_name = "Browser";
  let os = typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 120) : "unknown";
  try {
    const { Device } = await import("@capacitor/device");
    const info = await Device.getInfo();
    device_type = info.platform ?? device_type;
    device_name = [info.manufacturer, info.model].filter(Boolean).join(" ") || device_name;
    os = `${info.operatingSystem ?? ""} ${info.osVersion ?? ""}`.trim() || os;
  } catch {
    /* web */
  }
  return { device_type, device_name, os };
}

function normalizeStatus(payload: unknown): LicenseStatus {
  const raw =
    typeof payload === "object" && payload
      ? String(
          (payload as Record<string, unknown>)["status"] ??
            (payload as Record<string, unknown>)["state"] ??
            (payload as Record<string, unknown>)["license_status"] ??
            "",
        ).toLowerCase()
      : "";
  if (raw.includes("active")) return "active";
  if (raw.includes("lock")) return "locked";
  if (raw.includes("not_found") || raw.includes("notfound") || raw.includes("invalid"))
    return "not_found";
  return "unknown";
}

export type LicenseResult = { status: LicenseStatus; message?: string | undefined };

export async function checkLicense(licenseKey: string): Promise<LicenseResult> {
  const key = licenseKey.trim();
  if (!key) return { status: "not_found" };

  const [device_id, meta] = await Promise.all([getDeviceId(), getDeviceMeta()]);

  try {
    const res = await fetch(`${API_BASE}/api/public/license/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: key,
        device_id,
        device_type: meta.device_type,
        device_name: meta.device_name,
        os: meta.os,
        product_key: PRODUCT_KEY,
      }),
    });

    if (res.status === 404) return { status: "not_found" };

    const payload = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    const status = normalizeStatus(payload);
    const message = typeof payload?.["message"] === "string" ? payload["message"] : undefined;

    if (status === "unknown" && !res.ok) return { status: "not_found", message };
    if (status !== "unknown") await setLastStatus(status);
    return { status, message };
  } catch {
    // Offline: never block the shopkeeper. Fall back to the last known status.
    return { status: "offline" };
  }
}

export type UpdateInfo = { available: boolean; latest?: string | undefined; url?: string | undefined };

function isNewer(latest: string, current: string) {
  const a = latest.split(".").map((n) => parseInt(n, 10) || 0);
  const b = current.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x > y;
  }
  return false;
}

/** Never throws, never blocks — silent failure is intentional. */
export async function checkAppVersion(): Promise<UpdateInfo> {
  try {
    const res = await fetch(
      `${API_BASE}/api/public/app-version?product_key=${encodeURIComponent(PRODUCT_KEY)}`,
    );
    if (!res.ok) return { available: false };
    const payload = (await res.json()) as Record<string, unknown>;
    const latest = String(
      payload["version"] ?? payload["latest_version"] ?? payload["app_version"] ?? "",
    ).trim();
    const url = payload["download_url"] ?? payload["url"] ?? payload["apk_url"];
    if (!latest) return { available: false };
    return {
      available: isNewer(latest, APP_VERSION),
      latest,
      url: typeof url === "string" ? url : undefined,
    };
  } catch {
    return { available: false };
  }
}

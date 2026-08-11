import { Preferences } from "@capacitor/preferences";

import { API_BASE, PRODUCT_KEY } from "./constants";

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

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Command Center requires a UUID v4 device_id — nothing else validates. */
function randomUuid(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function getDeviceId(): Promise<string> {
  const existing = await prefGet(KEY_DEVICE);
  if (existing && UUID_V4.test(existing)) return existing;
  const id = randomUuid();
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

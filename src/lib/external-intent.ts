/**
 * External intent bridge.
 *
 * Launching a native picker (contacts, camera, file chooser) sends the app to
 * the background. The App Lock's resume handler would normally re-show the PIN
 * screen, which unmounts the form and throws away the picked data.
 *
 * So: before launching a picker we raise a persistent flag, and the picked
 * result is written to the SAME persistent store. The lock gate reads the flag
 * and skips exactly one background/resume cycle; the form reads the result back
 * on mount, regardless of whether the picker callback or the resume fired first.
 */

const FLAG = "assan_khata_expecting_external_result";
const PENDING = "assan_khata_pending_external_result";

export type PendingKind = "contact" | "photo";
export type PendingContact = { name: string; phone: string };

type Pending =
  | { kind: "contact"; value: PendingContact }
  | { kind: "photo"; value: string };

function store(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Raise the flag right BEFORE launching any external picker/intent. */
export function beginExternalIntent() {
  store()?.setItem(FLAG, String(Date.now()));
}

/** Lower the flag once the external round-trip is complete. */
export function endExternalIntent() {
  store()?.removeItem(FLAG);
}

/**
 * True when the current background/resume was caused by our own picker.
 * Stale flags (older than 10 minutes) are ignored so the lock can never be
 * disabled permanently by a crashed intent.
 */
export function isExpectingExternalResult(): boolean {
  const raw = store()?.getItem(FLAG);
  if (!raw) return false;
  const started = Number(raw);
  if (!Number.isFinite(started) || Date.now() - started > 10 * 60 * 1000) {
    endExternalIntent();
    return false;
  }
  return true;
}

export function setPendingExternalResult(pending: Pending) {
  try {
    store()?.setItem(PENDING, JSON.stringify(pending));
  } catch {
    /* quota (large photo) — the in-memory callback path still works */
  }
}

/** Reads and removes the stored result, if it matches the requested kind. */
export function takePendingExternalResult<K extends PendingKind>(
  kind: K,
): (K extends "contact" ? PendingContact : string) | null {
  const raw = store()?.getItem(PENDING);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Pending;
    if (parsed.kind !== kind) return null;
    store()?.removeItem(PENDING);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return parsed.value as any;
  } catch {
    store()?.removeItem(PENDING);
    return null;
  }
}

/**
 * Tracks when the app intentionally hands control to a native screen
 * (contact picker, share sheet, file save). While that happens Android
 * backgrounds the WebView, which used to re-arm the PIN lock and throw the
 * user out of the dialog they were filling in.
 */

let active = 0;
let lastEnded = 0;

/** Grace window after the native screen closes, before locking is allowed again. */
const GRACE_MS = 2500;

export function beginNativeActivity() {
  active += 1;
}

export function endNativeActivity() {
  active = Math.max(0, active - 1);
  lastEnded = Date.now();
}

export function isNativeActivityActive(): boolean {
  return active > 0 || Date.now() - lastEnded < GRACE_MS;
}

/** Runs `fn` while the lock gate is suspended. */
export async function withNativeActivity<T>(fn: () => Promise<T>): Promise<T> {
  beginNativeActivity();
  try {
    return await fn();
  } finally {
    endNativeActivity();
  }
}

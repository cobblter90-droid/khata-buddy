/** Single source of truth for the release version.
 *  CI reads this to stamp the Android versionName/versionCode,
 *  Settings displays it, and the update checker compares against it.
 *  Bump this on every release build. */
export const APP_VERSION = "1.0.2";

export const PRODUCT_KEY = "posp-khata";
export const API_BASE = "https://urdevelopers.lovable.app";

export const SUPPORT_UMAR = "Umar 0315-0496755";
export const SUPPORT_RAHEEL = "Raheel 0321-1518621";
export const SUPPORT_LINE = `${SUPPORT_UMAR} · ${SUPPORT_RAHEEL}`;

/** Mandatory on every bill / receipt / statement. No exceptions. */
export const BILL_FOOTER = `PoSP By U&R developers — ${SUPPORT_UMAR} — ${SUPPORT_RAHEEL}`;

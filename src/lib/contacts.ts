/**
 * Runtime contacts access.
 *
 * Preferred path on Android is the system contact picker (`pickContact`):
 * it opens the OS picker and returns one contact WITHOUT needing the
 * READ_CONTACTS runtime permission. Only the "load the whole list" path
 * needs the permission, so we ask for it lazily there.
 */

import { Capacitor } from "@capacitor/core";

export type PhoneContact = { name: string; phone: string };

export type ContactsResult =
  | { ok: true; contacts: PhoneContact[] }
  | { ok: false; reason: "denied" | "web" | "cancelled" | "failed"; detail?: string };

export type PickResult =
  | { ok: true; contact: PhoneContact }
  | { ok: false; reason: "denied" | "web" | "cancelled" | "failed"; detail?: string };

function isNative(): boolean {
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    /* fall through to the global check */
  }
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Boolean((window as any).Capacitor?.isNativePlatform?.());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPhoneContact(c: any): PhoneContact {
  return {
    name: c?.name?.display ?? [c?.name?.given, c?.name?.family].filter(Boolean).join(" ") ?? "",
    phone: c?.phones?.[0]?.number ?? "",
  };
}

/** Opens the Android system contact picker. No permission prompt required. */
export async function pickContact(): Promise<PickResult> {
  if (!isNative()) return { ok: false, reason: "web" };
  try {
    const { Contacts } = await import("@capacitor-community/contacts");
    const res = await Contacts.pickContact({ projection: { name: true, phones: true } });
    const contact = toPhoneContact(res?.contact);
    if (!contact.name && !contact.phone) return { ok: false, reason: "cancelled" };
    return { ok: true, contact };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/cancel/i.test(msg)) return { ok: false, reason: "cancelled" };
    console.error("pickContact failed", err);
    return { ok: false, reason: "failed", detail: msg };
  }
}

/** Reads the full contact list. Needs the READ_CONTACTS runtime permission. */
export async function loadContacts(): Promise<ContactsResult> {
  if (!isNative()) return { ok: false, reason: "web" };

  try {
    const { Contacts } = await import("@capacitor-community/contacts");

    let perm = await Contacts.checkPermissions();
    if (perm.contacts !== "granted") perm = await Contacts.requestPermissions();
    if (perm.contacts !== "granted" && perm.contacts !== "limited")
      return { ok: false, reason: "denied" };

    const res = await Contacts.getContacts({ projection: { name: true, phones: true } });
    const contacts: PhoneContact[] = (res.contacts ?? [])
      .map(toPhoneContact)
      .filter((c) => c.name || c.phone);
    return { ok: true, contacts };
  } catch (err) {
    console.error("Contacts read failed", err);
    return { ok: false, reason: "failed", detail: err instanceof Error ? err.message : String(err) };
  }
}

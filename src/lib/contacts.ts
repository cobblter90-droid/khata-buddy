/**
 * Runtime contacts access.
 *
 * Native (Android): @capacitor-community/contacts, with the runtime permission
 * prompt. Web: not available, so the shopkeeper types the name by hand.
 */

export type PhoneContact = { name: string; phone: string };

export type ContactsResult =
  | { ok: true; contacts: PhoneContact[] }
  | { ok: false; reason: "denied" | "web" | "failed"; detail?: string };

function isNative(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Boolean((window as any).Capacitor?.isNativePlatform?.());
}

export async function loadContacts(): Promise<ContactsResult> {
  if (!isNative()) return { ok: false, reason: "web" };

  try {
    const { Contacts } = await import("@capacitor-community/contacts");

    // Ask for the runtime permission; on Android 6+ the manifest entry alone
    // is not enough. Re-check afterwards because some OEMs return "prompt".
    let perm = await Contacts.checkPermissions();
    if (perm.contacts !== "granted") perm = await Contacts.requestPermissions();
    if (perm.contacts !== "granted") return { ok: false, reason: "denied" };

    const res = await Contacts.getContacts({ projection: { name: true, phones: true } });
    const contacts: PhoneContact[] = (res.contacts ?? [])
      .map((c) => ({ name: c.name?.display ?? "", phone: c.phones?.[0]?.number ?? "" }))
      .filter((c) => c.name || c.phone);
    return { ok: true, contacts };
  } catch (err) {
    console.error("Contacts read failed", err);
    return { ok: false, reason: "failed", detail: err instanceof Error ? err.message : String(err) };
  }
}

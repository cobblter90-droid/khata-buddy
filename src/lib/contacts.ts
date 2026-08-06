/**
 * Runtime contacts access. Native only — on web we fail gracefully so the
 * shopkeeper can always type the name by hand.
 */

export type PhoneContact = { name: string; phone: string };

export type ContactsResult =
  | { ok: true; contacts: PhoneContact[] }
  | { ok: false; reason: "denied" | "unavailable" };

export async function loadContacts(): Promise<ContactsResult> {
  try {
    const { Contacts } = await import("@capacitor-community/contacts");
    const perm = await Contacts.requestPermissions();
    if (perm.contacts !== "granted") return { ok: false, reason: "denied" };
    const res = await Contacts.getContacts({ projection: { name: true, phones: true } });
    const contacts: PhoneContact[] = (res.contacts ?? [])
      .map((c) => ({ name: c.name?.display ?? "", phone: c.phones?.[0]?.number ?? "" }))
      .filter((c) => c.name || c.phone);
    return { ok: true, contacts };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

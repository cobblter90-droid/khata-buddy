import { useMemo, useState } from "react";
import { Loader2, Search, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as db from "@/lib/db";
import { loadContacts, pickContact, type PhoneContact } from "@/lib/contacts";
import { useT } from "@/lib/i18n";
import type { Customer } from "@/lib/types";
import { useCollection } from "@/lib/use-store";

type Props = {
  value: string | null;
  onChange: (customer: Customer | null) => void;
};

/** Live-search customer picker with inline "add new" + contacts import. */
export function CustomerPicker({ value, onChange }: Props) {
  const { t } = useT();
  const customers = useCollection<Customer>("customers");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contacts, setContacts] = useState<PhoneContact[] | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = customers.find((c) => c.id === value) ?? null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return customers
      .filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [customers, query]);


  async function importContacts() {
    setLoading(true);
    // Preferred: the Android system picker — no runtime permission needed.
    const picked = await pickContact();
    if (picked.ok) {
      setLoading(false);
      setName(picked.contact.name);
      setPhone(picked.contact.phone);
      setAdding(true);
      return;
    }
    if (picked.reason === "cancelled") {
      setLoading(false);
      return;
    }
    // Fallback: full list read (asks for READ_CONTACTS).
    const res = await loadContacts();
    setLoading(false);
    if (!res.ok) {
      if (res.reason === "denied") toast.error(t("contactsDenied"));
      else if (res.reason === "web") toast.error(t("contactsWebOnly"));
      else if (res.reason === "cancelled") return;
      else toast.error(`${t("contactsFailed")} ${res.detail ?? ""}`.trim());
      return;
    }
    if (res.contacts.length === 0) toast.info(t("contactsEmpty"));
    setContacts(res.contacts);
  }


  async function createCustomer(nextName: string, nextPhone: string, fromContacts: boolean) {
    if (!nextName.trim() && !nextPhone.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    const created = await db.insert<Omit<Customer, "createdAt" | "updatedAt">>("customers", {
      id: db.newId("cus"),
      deletedAt: null,
      name: nextName.trim() || nextPhone.trim(),
      phone: nextPhone.trim(),
      source: fromContacts ? "contacts" : "manual",
      reminderDate: null,
    });
    onChange(created as Customer);
    setAdding(false);
    setContacts(null);
    setName("");
    setPhone("");
    setQuery("");
  }

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
          {(selected.name || "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{selected.name}</span>
          <span className="tabular block text-xs text-muted-foreground">
            {selected.phone || "—"}
          </span>
        </span>
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
          <X className="mr-1 h-4 w-4" />
          {t("change")}
        </Button>
      </div>
    );
  }

  if (contacts) {
    return (
      <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
        <Input
          placeholder={t("search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="max-h-56 space-y-1.5 overflow-y-auto">
          {contacts
            .filter((c) =>
              `${c.name} ${c.phone}`.toLowerCase().includes(query.trim().toLowerCase()),
            )
            .slice(0, 50)
            .map((c, i) => (
              <li key={`${c.phone}-${i}`}>
                <button
                  type="button"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-left"
                  onClick={() => void createCustomer(c.name, c.phone, true)}
                >
                  <span className="block truncate text-sm font-semibold">{c.name || c.phone}</span>
                  <span className="tabular block text-xs text-muted-foreground">{c.phone}</span>
                </button>
              </li>
            ))}
        </ul>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setContacts(null)}
        >
          {t("back")}
        </Button>
      </div>
    );
  }

  if (adding) {
    return (
      <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
        <Input
          placeholder={t("customerName")}
          value={name}
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
          className="h-12"
        />
        <Input
          placeholder="03xx-xxxxxxx"
          type="tel"
          inputMode="tel"
          value={phone}
          autoComplete="off"
          onChange={(e) => setPhone(e.target.value)}
          className="h-12"
        />
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-12"
            disabled={loading}
            onClick={() => void importContacts()}
          >
            {loading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Users className="mr-1.5 h-4 w-4" />
            )}
            {t("importContacts")}
          </Button>
          <Button
            type="button"
            className="h-12"
            onClick={() => void createCustomer(name, phone, false)}
          >
            {t("save")}
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setAdding(false)}
        >
          {t("cancel")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 pl-9"
          autoComplete="off"
          placeholder={t("searchCustomer")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {query.trim() ? (
        matches.length > 0 ? (
          <ul className="space-y-1.5">
            {matches.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onChange(c)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                    {(c.name || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{c.name}</span>
                    <span className="tabular block text-xs text-muted-foreground">
                      {c.phone || "—"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-1 text-xs text-muted-foreground">{t("noCustomerMatch")}</p>
        )
      ) : null}


      <Button
        type="button"
        variant="outline"
        className="h-12 w-full"
        onClick={() => {
          setName(query.trim());
          setAdding(true);
        }}
      >
        <UserPlus className="mr-1.5 h-4 w-4" />
        {t("addNewCustomer")}
      </Button>
    </div>
  );
}

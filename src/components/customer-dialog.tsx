import { useEffect, useState } from "react";
import { Loader2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as db from "@/lib/db";
import { loadContacts, pickContact } from "@/lib/contacts";
import { takePendingExternalResult } from "@/lib/external-intent";
import { useT } from "@/lib/i18n";
import type { Customer } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Customer | undefined;
};

type Contact = { name: string; phone: string };

export function CustomerDialog({ open, onOpenChange, editing }: Props) {
  const { t } = useT();
  const [name, setName] = useState(editing?.name ?? "");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // The contact picker may have returned while the App Lock was mounting, so
  // always read the persisted result back when this form appears.
  useEffect(() => {
    if (!open) return;
    const pending = takePendingExternalResult("contact");
    if (!pending) return;
    setName(pending.name);
    setPhone(pending.phone);
  }, [open]);

  function reset() {
    setName(editing?.name ?? "");
    setPhone(editing?.phone ?? "");
    setContacts(null);
    setSearch("");
  }

  async function importContacts() {
    setLoading(true);
    // Preferred: the Android system picker — no runtime permission needed.
    const picked = await pickContact();
    if (picked.ok) {
      setLoading(false);
      setName(picked.contact.name);
      setPhone(picked.contact.phone);
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


  async function save(nextName: string, nextPhone: string) {
    if (!nextName.trim() && !nextPhone.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    if (editing) {
      await db.put<Customer>("customers", {
        ...editing,
        name: nextName.trim() || nextPhone.trim(),
        phone: nextPhone.trim(),
      });
    } else {
      await db.insert<Omit<Customer, "createdAt" | "updatedAt">>("customers", {
        id: db.newId("cus"),
        name: nextName.trim() || nextPhone.trim(),
        phone: nextPhone.trim(),
        source: contacts ? "contacts" : "manual",
        reminderDate: null,
      });
    }
    toast.success(t("saved"));
    reset();
    onOpenChange(false);
  }

  const filtered = (contacts ?? []).filter((c) =>
    `${c.name} ${c.phone}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? t("edit") : t("addCustomer")}</DialogTitle>
        </DialogHeader>

        {contacts ? (
          <div className="space-y-3">
            <Input
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <ul className="max-h-72 space-y-1.5 overflow-y-auto">
              {filtered.map((c, i) => (
                <li key={`${c.phone}-${i}`}>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-left"
                    onClick={() => void save(c.name, c.phone)}
                  >
                    <p className="truncate text-sm font-semibold">{c.name || c.phone}</p>
                    <p className="tabular text-xs text-muted-foreground">{c.phone}</p>
                  </button>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" onClick={() => setContacts(null)}>
              {t("back")}
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void save(name, phone);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="cus-name">{t("customerName")}</Label>
              <Input
                id="cus-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cus-phone">{t("phone")}</Label>
              <Input
                id="cus-phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="off"
                placeholder="03xx-xxxxxxx"
              />
            </div>

            <Button type="submit" size="lg" className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              {t("save")}
            </Button>

            {editing ? null : (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                disabled={loading}
                onClick={() => void importContacts()}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Users className="mr-2 h-4 w-4" />
                )}
                {t("importContacts")}
              </Button>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

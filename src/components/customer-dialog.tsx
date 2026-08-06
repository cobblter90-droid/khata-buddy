import { useState } from "react";
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

  function reset() {
    setName(editing?.name ?? "");
    setPhone(editing?.phone ?? "");
    setContacts(null);
    setSearch("");
  }

  async function importContacts() {
    setLoading(true);
    try {
      const { Contacts } = await import("@capacitor-community/contacts");
      // Runtime permission prompt — must complete before we can read anything.
      const perm = await Contacts.requestPermissions();
      if (perm.contacts !== "granted") {
        toast.error(t("contactsDenied"));
        return;
      }
      const res = await Contacts.getContacts({ projection: { name: true, phones: true } });
      const mapped: Contact[] = (res.contacts ?? [])
        .map((c) => ({
          name: c.name?.display ?? "",
          phone: c.phones?.[0]?.number ?? "",
        }))
        .filter((c) => c.name || c.phone);
      if (mapped.length === 0) toast.info(t("contactsEmpty"));
      setContacts(mapped);
    } catch {
      toast.error(t("contactsUnavailable"));
    } finally {
      setLoading(false);
    }
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

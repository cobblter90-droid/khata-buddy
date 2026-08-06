import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Download,
  FileUp,
  LockKeyhole,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { APP_VERSION, BILL_FOOTER, SUPPORT_LINE } from "@/lib/constants";
import * as db from "@/lib/db";
import { useT } from "@/lib/i18n";
import { useSettings, saveSettings } from "@/lib/use-store";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account & Settings | Assan Khata By U&R" },
      {
        name: "description",
        content:
          "Business profile, language toggle, app lock, cashbook, backup and recovery settings for Assan Khata.",
      },
      { property: "og:title", content: "Account & Settings | Assan Khata" },
      {
        property: "og:description",
        content: "Manage your shop profile, backup and app lock in Assan Khata By U&R.",
      },
    ],
  }),
  component: AccountPage,
});

const LINKS = [
  { to: "/wasoola", key: "wasoola", sub: "wasoolaSub", icon: Wallet },
  { to: "/cashbook", key: "cashbook", sub: "cashbookSub", icon: BookOpen },
  { to: "/bin", key: "deletedItems", sub: "restore", icon: Trash2 },
  { to: "/privacy", key: "privacy", sub: "businessInfo", icon: ShieldCheck },
] as const;

function AccountPage() {
  const { t, lang } = useT();
  const settings = useSettings();
  const [name, setName] = useState(settings.businessName);
  const [phone, setPhone] = useState(settings.businessPhone);
  const [address, setAddress] = useState(settings.businessAddress);
  const [pin, setPin] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function exportBackup() {
    const blob = new Blob([JSON.stringify(db.exportSnapshot(), null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `assan-khata-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(t("backupDone"));
  }

  function importBackup(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as { data?: Record<string, db.BaseDoc[]> };
        if (!parsed?.data) throw new Error("bad file");
        void db.importSnapshot(parsed).then(() => toast.success(t("importDone")));
      } catch {
        toast.error(t("importFailed"));
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="px-4 pb-8">
      <header className="py-5 text-center">
        <Logo className="mx-auto h-20 w-20 rounded-3xl shadow-raised" />
        <h1 className="mt-3 text-lg font-bold">{settings.businessName || t("appName")}</h1>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          By U&amp;R Developers · v{APP_VERSION}
        </p>
      </header>

      {/* Business profile */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <h2 className="text-sm font-bold text-card-foreground">{t("businessInfo")}</h2>
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="biz-name">{t("businessName")}</Label>
            <Input id="biz-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="biz-phone">{t("businessPhone")}</Label>
            <Input
              id="biz-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="biz-address">{t("businessAddress")}</Label>
            <Input id="biz-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <Button
            className="w-full"
            onClick={() => {
              void saveSettings({
                businessName: name.trim(),
                businessPhone: phone.trim(),
                businessAddress: address.trim(),
              });
              toast.success(t("saved"));
            }}
          >
            {t("save")}
          </Button>
        </div>
      </section>

      {/* App settings */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-card">
        <h2 className="text-sm font-bold text-card-foreground">{t("settingsTitle")}</h2>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold">{t("language")}</span>
          <div className="flex overflow-hidden rounded-full border border-border">
            {(["ur", "en"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => void saveSettings({ language: code })}
                className={`px-3 py-1.5 text-xs font-bold ${
                  lang === code ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {code === "ur" ? "Urdu" : "English"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <LockKeyhole className="h-4 w-4" />
              {t("appLock")}
            </p>
            <p className="text-xs text-muted-foreground">{t("appLockSub")}</p>
          </div>
          <Switch
            checked={settings.pinEnabled}
            onCheckedChange={(next) => {
              if (!next) {
                void saveSettings({ pinEnabled: false, pin: null });
                return;
              }
              if (pin.length < 4) {
                toast.error(t("pinTitle"));
                return;
              }
              void saveSettings({ pinEnabled: true, pin });
              setPin("");
              toast.success(t("saved"));
            }}
          />
        </div>
        {!settings.pinEnabled ? (
          <div className="mt-2 space-y-1.5">
            <Label htmlFor="pin">{t("pinTitle")}</Label>
            <Input
              id="pin"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
              className="tabular text-center tracking-[0.3em]"
              placeholder="••••"
            />
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={exportBackup}>
            <Download className="mr-1 h-4 w-4" />
            {t("exportBackup")}
          </Button>
          <label className="flex h-9 cursor-pointer items-center justify-center gap-1 rounded-md border border-border px-3 text-sm font-medium">
            <FileUp className="h-4 w-4" />
            {t("importBackup")}
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => importBackup(e.target.files?.[0])}
            />
          </label>
        </div>
      </section>

      {/* Links */}
      <ul className="mt-4 space-y-2">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <li key={link.to}>
              <Link
                to={link.to}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                  <Icon className="h-4 w-4 text-secondary-foreground" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold">{t(link.key)}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Destructive */}
      <section className="mt-4 rounded-2xl border border-destructive/30 bg-card p-4">
        <h2 className="text-sm font-bold text-destructive">{t("deleteAccount")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("deleteAccountWarn")}</p>
        {confirmDelete ? (
          <div className="mt-3 flex gap-2">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                void db.wipeAll().then(() => toast.success(t("accountDeleted")));
                setConfirmDelete(false);
              }}
            >
              {t("confirm")}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>
              {t("cancel")}
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="mt-3 w-full text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="mr-1 h-4 w-4" />
            {t("deleteAccount")}
          </Button>
        )}
      </section>

      <p className="mt-6 text-center text-xs text-muted-foreground">{SUPPORT_LINE}</p>
      <p className="mt-1 text-center text-[10px] text-muted-foreground">{BILL_FOOTER}</p>
    </div>
  );
}

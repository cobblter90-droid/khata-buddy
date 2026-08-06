import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CalendarClock, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { LedgerDialog } from "@/components/ledger-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BILL_FOOTER } from "@/lib/constants";
import * as db from "@/lib/db";
import { formatDate, isOverdue, rs, toDateInput } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { balanceOf } from "@/lib/khata";
import { shareText } from "@/lib/share";
import type { Customer, LedgerEntry } from "@/lib/types";
import { useCollection, useDoc, useSettings } from "@/lib/use-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/khata/$customerId")({
  head: () => ({
    meta: [
      { title: "Customer Ledger — Diye / Liye | Assan Khata By U&R" },
      {
        name: "description",
        content:
          "Full Diye/Liye history for one customer with balance banner, reminder date and one-tap WhatsApp balance sharing.",
      },
      { property: "og:title", content: "Customer Ledger | Assan Khata" },
      {
        property: "og:description",
        content: "Every udhaar entry for a customer, stored offline on your phone.",
      },
    ],
  }),
  component: CustomerPage,
});

function CustomerPage() {
  const { customerId } = Route.useParams();
  const { t } = useT();
  const settings = useSettings();
  const customer = useDoc<Customer>("customers", customerId);
  const allEntries = useCollection<LedgerEntry>("ledger");
  const [dialog, setDialog] = useState<"diye" | "liye" | null>(null);

  if (!customer || customer.deletedAt) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">{t("customerNotFound")}</p>
        <Link to="/khata" className="mt-4 inline-block text-sm font-semibold text-primary">
          {t("back")}
        </Link>
      </div>
    );
  }

  const entries = allEntries
    .filter((e) => e.customerId === customerId)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const balance = balanceOf(customerId, allEntries);

  async function share() {
    const lines = [
      settings.businessName || t("appName"),
      `${customer!.name} — ${t("balance")}: ${rs(Math.abs(balance))} ${
        balance > 0 ? `(${t("toGet")})` : balance < 0 ? `(${t("toGive")})` : ""
      }`,
      "",
      ...entries
        .slice(0, 15)
        .map(
          (e) =>
            `${formatDate(e.date)} · ${e.kind === "diye" ? t("iGave") : t("iReceived")} ${rs(e.amount)}`,
        ),
      "",
      BILL_FOOTER,
    ];
    await shareText(lines.join("\n"), customer!.phone);
  }

  async function setReminder(value: string) {
    await db.put<Customer>("customers", {
      ...customer!,
      reminderDate: value ? new Date(`${value}T12:00:00`).toISOString() : null,
    });
    toast.success(t("saved"));
  }

  return (
    <div className="px-4 pb-6">
      <header className="flex items-center gap-2 py-4">
        <Link to="/khata" aria-label={t("back")} className="rounded-lg p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{customer.name}</h1>
          <p className="tabular text-xs text-muted-foreground">{customer.phone || "—"}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void share()}>
          <Send className="mr-1 h-4 w-4" />
          {t("shareBalance")}
        </Button>
      </header>

      <div
        className={cn(
          "rounded-2xl px-4 py-4 shadow-card",
          balance > 0 ? "bg-cash-soft" : balance < 0 ? "bg-credit-soft" : "bg-card",
        )}
      >
        <p className="text-xs font-semibold text-muted-foreground">
          {balance > 0 ? t("toGet") : balance < 0 ? t("toGive") : t("settled")}
        </p>
        <p
          className={cn(
            "tabular mt-1 text-3xl font-bold",
            balance > 0 ? "text-cash" : balance < 0 ? "text-credit" : "text-foreground",
          )}
        >
          {rs(Math.abs(balance))}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
        <CalendarClock
          className={cn(
            "h-4 w-4",
            isOverdue(customer.reminderDate) ? "text-brass" : "text-muted-foreground",
          )}
        />
        <label htmlFor="cus-reminder" className="flex-1 text-sm font-semibold">
          {t("setReminder")}
        </label>
        <Input
          id="cus-reminder"
          type="date"
          className="h-9 w-[9.5rem]"
          value={customer.reminderDate ? toDateInput(new Date(customer.reminderDate)) : ""}
          onChange={(e) => void setReminder(e.target.value)}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button size="lg" className="bg-credit text-white hover:bg-credit/90" onClick={() => setDialog("diye")}>
          {t("iGave")}
        </Button>
        <Button size="lg" className="bg-cash text-cash-foreground hover:bg-cash/90" onClick={() => setDialog("liye")}>
          {t("iReceived")}
        </Button>
      </div>

      <h2 className="mt-6 mb-2 text-sm font-bold text-muted-foreground">{t("transactions")}</h2>
      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          {t("noTransactions")}
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {e.kind === "diye" ? t("iGave") : t("iReceived")}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(e.date)}</p>
                {e.note ? <p className="mt-1 text-xs text-muted-foreground">{e.note}</p> : null}
                {e.reminderDate ? (
                  <p className="mt-1 text-[11px] font-semibold text-brass">
                    {t("dueOn")}: {formatDate(e.reminderDate)}
                  </p>
                ) : null}
                {e.photo ? (
                  <img src={e.photo} alt={t("attachPhoto")} className="mt-2 h-20 rounded-lg object-cover" />
                ) : null}
              </div>
              <span
                className={cn("tabular font-bold", e.kind === "diye" ? "text-credit" : "text-cash")}
              >
                {e.kind === "diye" ? "+" : "−"}
                {rs(e.amount)}
              </span>
              <button
                type="button"
                aria-label={t("delete")}
                className="rounded-lg p-1.5 text-destructive"
                onClick={() => {
                  void db.softDelete("ledger", e.id);
                  toast.success(t("deleted"));
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-center text-[10px] text-muted-foreground">{BILL_FOOTER}</p>

      {dialog ? (
        <LedgerDialog
          open
          onOpenChange={(next) => {
            if (!next) setDialog(null);
          }}
          customerId={customerId}
          kind={dialog}
        />
      ) : null}
    </div>
  );
}

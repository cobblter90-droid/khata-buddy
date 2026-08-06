import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";

import { BILL_FOOTER } from "@/lib/constants";
import { formatDate, rs } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { balanceOf, overdueCustomers } from "@/lib/khata";
import { shareText } from "@/lib/share";
import type { Customer, LedgerEntry } from "@/lib/types";
import { useCollection, useSettings } from "@/lib/use-store";

export const Route = createFileRoute("/wasoola")({
  head: () => ({
    meta: [
      { title: "Wasoola — Overdue Recovery List | Assan Khata By U&R" },
      {
        name: "description",
        content:
          "Wasoola list of customers whose reminder date has passed and who still owe you money, with one-tap reminder sharing.",
      },
      { property: "og:title", content: "Wasoola — Recovery List | Assan Khata" },
      { property: "og:description", content: "Follow up on overdue udhaar without opening a laptop." },
    ],
  }),
  component: WasoolaPage,
});

function WasoolaPage() {
  const { t } = useT();
  const settings = useSettings();
  const customers = useCollection<Customer>("customers");
  const entries = useCollection<LedgerEntry>("ledger");

  const overdue = overdueCustomers(customers, entries);
  const pending = customers
    .filter((c) => balanceOf(c.id, entries) > 0 && !overdue.some((o) => o.id === c.id))
    .sort((a, b) => balanceOf(b.id, entries) - balanceOf(a.id, entries));

  function remind(c: Customer) {
    const bal = balanceOf(c.id, entries);
    void shareText(
      [
        settings.businessName || t("appName"),
        `${c.name} — ${t("balance")}: ${rs(bal)}`,
        c.reminderDate ? `${t("dueOn")}: ${formatDate(c.reminderDate)}` : "",
        "",
        BILL_FOOTER,
      ]
        .filter(Boolean)
        .join("\n"),
      c.phone,
    );
  }

  function row(c: Customer, overdueRow: boolean) {
    return (
      <li
        key={c.id}
        className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card"
      >
        <Link to="/khata/$customerId" params={{ customerId: c.id }} className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-card-foreground">{c.name}</span>
          <span className="block text-xs text-muted-foreground">
            {overdueRow && c.reminderDate ? `${t("dueOn")}: ${formatDate(c.reminderDate)}` : c.phone || "—"}
          </span>
        </Link>
        <span className="tabular font-bold text-cash">{rs(balanceOf(c.id, entries))}</span>
        <button
          type="button"
          aria-label={t("shareBalance")}
          className="rounded-lg p-2 text-primary"
          onClick={() => remind(c)}
        >
          <Send className="h-4 w-4" />
        </button>
      </li>
    );
  }

  return (
    <div className="px-4 pb-6">
      <header className="flex items-center gap-2 py-4">
        <Link to="/account" aria-label={t("back")} className="rounded-lg p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold">{t("wasoola")}</h1>
          <p className="text-xs text-muted-foreground">{t("wasoolaSub")}</p>
        </div>
      </header>

      {overdue.length > 0 ? (
        <>
          <h2 className="mb-2 text-sm font-bold text-brass">
            {overdue.length} {t("overdueCount")}
          </h2>
          <ul className="space-y-2">{overdue.map((c) => row(c, true))}</ul>
        </>
      ) : null}

      <h2 className="mt-5 mb-2 text-sm font-bold text-muted-foreground">{t("toGet")}</h2>
      {pending.length === 0 && overdue.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          {t("noCustomers")}
        </p>
      ) : (
        <ul className="space-y-2">{pending.map((c) => row(c, false))}</ul>
      )}

      <p className="mt-6 text-center text-[10px] text-muted-foreground">{BILL_FOOTER}</p>
    </div>
  );
}

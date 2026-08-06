import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, ChevronRight, Plus, Search } from "lucide-react";

import { CustomerDialog } from "@/components/customer-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rs } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { balanceOf, overdueCustomers, totals } from "@/lib/khata";
import type { Customer, LedgerEntry } from "@/lib/types";
import { useCollection } from "@/lib/use-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/khata")({
  head: () => ({
    meta: [
      { title: "Khata — Customer Ledger | Assan Khata By U&R" },
      {
        name: "description",
        content:
          "Customer udhaar ledger: balances, Diye/Liye entries, reminders and WhatsApp balance sharing — all offline on your device.",
      },
      { property: "og:title", content: "Khata — Customer Ledger | Assan Khata" },
      {
        property: "og:description",
        content: "Track every customer's udhaar balance offline with Assan Khata By U&R.",
      },
    ],
  }),
  component: KhataPage,
});

function KhataPage() {
  const { t } = useT();
  const customers = useCollection<Customer>("customers");
  const entries = useCollection<LedgerEntry>("ledger");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(q));
  }, [customers, query]);

  const { toGet, toGive } = totals(customers, entries);
  const overdue = overdueCustomers(customers, entries);

  return (
    <div className="px-4 pb-6">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-xl font-bold">{t("khataTitle")}</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("addCustomer")}
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-cash-soft px-4 py-3 shadow-card">
          <p className="text-xs font-semibold text-muted-foreground">{t("toGet")}</p>
          <p className="tabular mt-1 text-xl font-bold text-cash">{rs(toGet)}</p>
        </div>
        <div className="rounded-2xl bg-credit-soft px-4 py-3 shadow-card">
          <p className="text-xs font-semibold text-muted-foreground">{t("toGive")}</p>
          <p className="tabular mt-1 text-xl font-bold text-credit">{rs(toGive)}</p>
        </div>
      </div>

      {overdue.length > 0 ? (
        <Link
          to="/wasoola"
          className="mt-3 flex items-center gap-2 rounded-2xl border border-brass/40 bg-brass/10 px-4 py-2.5 text-sm font-semibold text-foreground"
        >
          <AlertTriangle className="h-4 w-4 text-brass" />
          <span className="flex-1">
            {overdue.length} {t("overdueCount")}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      ) : null}

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 pl-9"
          autoComplete="off"
          placeholder={t("searchCustomer")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <h2 className="mt-4 mb-2 text-sm font-bold text-muted-foreground">{t("transactions")}</h2>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          {customers.length === 0 ? t("noCustomers") : t("noCustomerMatch")}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((c) => {
            const bal = balanceOf(c.id, entries);
            return (
              <li key={c.id}>
                <Link
                  to="/khata/$customerId"
                  params={{ customerId: c.id }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                    {(c.name || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-card-foreground">{c.name}</span>
                    <span className="tabular block text-xs text-muted-foreground">
                      {c.phone || "—"}
                    </span>
                  </span>
                  <span className="text-right">
                    <span
                      className={cn(
                        "tabular block font-bold",
                        bal > 0 ? "text-cash" : bal < 0 ? "text-credit" : "text-muted-foreground",
                      )}
                    >
                      {rs(Math.abs(bal))}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {bal > 0 ? t("toGet") : bal < 0 ? t("toGive") : t("settled")}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <CustomerDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, ReceiptText, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SaleDialog } from "@/components/sale-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, inRange, periodRange, rs, toDateInput } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { PeriodKey, Sale } from "@/lib/types";
import { useCollection } from "@/lib/use-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Assan Khata By U&R — Offline Shop Sales & Udhaar Khata" },
      {
        name: "description",
        content:
          "Assan Khata By U&R: record sales, cash vs udhaar totals, itemised bills and customer khata — works fully offline on your phone.",
      },
      { property: "og:title", content: "Assan Khata By U&R — Shop Sales & Udhaar Khata" },
      {
        property: "og:description",
        content:
          "Offline bookkeeping for shopkeepers: sales dashboard, item catalog, customer udhaar ledger and shareable bills.",
      },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const { t } = useT();
  const sales = useCollection<Sale>("sales");
  const [period, setPeriod] = useState<PeriodKey>("week");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return toDateInput(d);
  });
  const [to, setTo] = useState(() => toDateInput(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);

  const range = useMemo(() => periodRange(period, from, to), [period, from, to]);

  const scoped = useMemo(() => sales.filter((s) => inRange(s.date, range)), [sales, range]);

  const stats = useMemo(() => {
    let cash = 0;
    let credit = 0;
    for (const sale of scoped) {
      if (sale.mode === "cash") cash += sale.total;
      else credit += sale.total;
    }
    return { total: cash + credit, orders: scoped.length, cash, credit };
  }, [scoped]);

  const chartData = useMemo(() => {
    const days = Math.max(
      1,
      Math.floor((range.end.getTime() - range.start.getTime()) / 86_400_000) + 1,
    );

    const buckets = new Map<string, { label: string; cash: number; credit: number }>();
    for (let i = 0; i < Math.min(days, 31); i += 1) {
      const d = new Date(range.start);
      d.setDate(d.getDate() + i);
      buckets.set(toDateInput(d), {
        label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        cash: 0,
        credit: 0,
      });
    }
    for (const sale of scoped) {
      const key = toDateInput(new Date(sale.date));
      const bucket = buckets.get(key);
      if (!bucket) continue;
      if (sale.mode === "cash") bucket.cash += sale.total;
      else bucket.credit += sale.total;
    }
    return Array.from(buckets.values());
  }, [scoped, range]);

  return (
    <div className="px-4 pb-6">
      <header className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-xl font-bold">{t("tabSales")}</h1>
          <p className="text-xs text-muted-foreground">
            {formatDate(range.start.toISOString())} – {formatDate(range.end.toISOString())}
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("newSale")}
        </Button>
      </header>

      <div className="flex gap-2">
        {(["week", "month", "custom"] as PeriodKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={cn(
              "flex-1 rounded-full border px-2 py-2 text-xs font-bold transition-colors",
              period === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {t(key === "week" ? "week" : key === "month" ? "month" : "custom")}
          </button>
        ))}
      </div>

      {period === "custom" ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs font-semibold text-muted-foreground">
            {t("from")}
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="space-y-1 text-xs font-semibold text-muted-foreground">
            {t("to")}
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard label={t("totalSales")} value={rs(stats.total)} tone="primary" />
        <StatCard label={t("totalOrders")} value={String(stats.orders)} tone="brass" />
        <StatCard label={t("totalCash")} value={rs(stats.cash)} tone="cash" />
        <StatCard label={t("totalCredit")} value={rs(stats.credit)} tone="credit" />
      </div>

      <section className="mt-5 rounded-[1.25rem] border border-border bg-card p-4 shadow-card">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t("chartTitle")}
        </h2>
        <div className="mt-3 h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                width={40}
                tickFormatter={(value: number) =>
                  value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value)
                }
              />

              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="cash"
                name={t("cash")}
                fill="var(--cash)"
                radius={[8, 8, 0, 0]}
                stackId="a"
              />
              <Bar
                dataKey="credit"
                name={t("credit")}
                fill="var(--credit)"
                radius={[8, 8, 0, 0]}
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-bold">{t("recentSales")}</h2>
        {scoped.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            {t("noSales")}
          </p>
        ) : (
          <ul className="space-y-2">
            {scoped.slice(0, 30).map((sale) => (
              <li key={sale.id}>
                <Link
                  to="/sale/$saleId"
                  params={{ saleId: sale.id }}
                  className="flex items-center gap-3 rounded-[1.25rem] border border-border bg-card px-4 py-3 shadow-card"
                >
                  <span className="icon-circle h-9 w-9 shrink-0">
                    <ReceiptText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{sale.invoiceNo}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(sale.date)}
                      {sale.note ? ` · ${sale.note}` : ""}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="tabular block font-bold">{rs(sale.total)}</span>
                    <ModeBadge mode={sale.mode} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SaleDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function ModeBadge({ mode }: { mode: Sale["mode"] }) {
  const { t } = useT();
  return (
    <span
      className={cn(
        "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
        mode === "cash" ? "bg-cash-soft text-cash" : "bg-credit-soft text-credit",
      )}
    >
      {mode === "cash" ? t("cash") : t("credit")}
    </span>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "cash" | "credit" | "brass";
}) {
  // Dark charcoal cards; lime is an accent on the key numbers only.
  const valueClass = {
    primary: "text-primary",
    cash: "text-primary",
    credit: "text-credit",
    brass: "text-stat-foreground",
  }[tone];

  return (
    <div className="stat-card px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-stat-muted">{label}</p>
      <p className={cn("tabular mt-1 text-lg font-bold leading-tight", valueClass)}>{value}</p>
    </div>
  );
}

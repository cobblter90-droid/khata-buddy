import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AmountKeypad } from "@/components/amount-keypad";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BILL_FOOTER } from "@/lib/constants";
import * as db from "@/lib/db";
import { formatDate, rs, todayIso, toNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { CashbookEntry } from "@/lib/types";
import { useCollection } from "@/lib/use-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cashbook")({
  head: () => ({
    meta: [
      { title: "Cashbook — Daily Cash In & Out | Assan Khata By U&R" },
      {
        name: "description",
        content:
          "Simple offline cashbook for your shop's daily naqad in and out, separate from customer khata entries.",
      },
      { property: "og:title", content: "Cashbook | Assan Khata" },
      { property: "og:description", content: "Log every rupee in and out of your cash drawer." },
    ],
  }),
  component: CashbookPage,
});

function CashbookPage() {
  const { t } = useT();
  const entries = useCollection<CashbookEntry>("cashbook");
  const [kind, setKind] = useState<"in" | "out" | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayIso());

  const cashIn = entries.filter((e) => e.kind === "in").reduce((s, e) => s + e.amount, 0);
  const cashOut = entries.filter((e) => e.kind === "out").reduce((s, e) => s + e.amount, 0);

  async function save() {
    const value = toNumber(amount);
    if (value <= 0 || !kind) {
      toast.error(t("amountRequired"));
      return;
    }
    await db.insert<Omit<CashbookEntry, "createdAt" | "updatedAt">>("cashbook", {
      id: db.newId("cash"),
      kind,
      amount: value,
      date: new Date(`${date}T12:00:00`).toISOString(),
      note: note.trim(),
    });
    toast.success(t("saved"));
    setAmount("");
    setNote("");
    setDate(todayIso());
    setKind(null);
  }

  return (
    <div className="px-4 pb-6">
      <header className="flex items-center gap-2 py-4">
        <Link to="/account" aria-label={t("back")} className="rounded-lg p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">{t("cashbook")}</h1>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-cash-soft px-3 py-3 shadow-card">
          <p className="text-[11px] font-semibold text-muted-foreground">{t("cashIn")}</p>
          <p className="tabular mt-0.5 text-base font-bold text-cash">{rs(cashIn)}</p>
        </div>
        <div className="rounded-2xl bg-credit-soft px-3 py-3 shadow-card">
          <p className="text-[11px] font-semibold text-muted-foreground">{t("cashOut")}</p>
          <p className="tabular mt-0.5 text-base font-bold text-credit">{rs(cashOut)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-3 py-3 shadow-card">
          <p className="text-[11px] font-semibold text-muted-foreground">{t("netCash")}</p>
          <p className="tabular mt-0.5 text-base font-bold">{rs(cashIn - cashOut)}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button size="lg" className="bg-cash text-cash-foreground hover:bg-cash/90" onClick={() => setKind("in")}>
          <TrendingUp className="mr-1 h-4 w-4" />
          {t("cashIn")}
        </Button>
        <Button size="lg" className="bg-credit text-white hover:bg-credit/90" onClick={() => setKind("out")}>
          <TrendingDown className="mr-1 h-4 w-4" />
          {t("cashOut")}
        </Button>
      </div>

      <ul className="mt-5 space-y-2">
        {entries.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            {t("noCashbook")}
          </li>
        ) : (
          entries.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {e.kind === "in" ? t("cashIn") : t("cashOut")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(e.date)}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
              </div>
              <span className={cn("tabular font-bold", e.kind === "in" ? "text-cash" : "text-credit")}>
                {e.kind === "in" ? "+" : "−"}
                {rs(e.amount)}
              </span>
            </li>
          ))
        )}
      </ul>

      <p className="mt-6 text-center text-[10px] text-muted-foreground">{BILL_FOOTER}</p>

      <Dialog
        open={kind !== null}
        onOpenChange={(next) => {
          if (!next) setKind(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{kind === "in" ? t("cashIn") : t("cashOut")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cb-amount">{t("amount")}</Label>
              <Input
                id="cb-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="tabular h-12 text-center text-xl font-bold"
                placeholder="0"
              />
            </div>
            <AmountKeypad value={amount} onChange={setAmount} />
            <div className="space-y-2">
              <Label htmlFor="cb-note">{t("note")}</Label>
              <Input id="cb-note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cb-date">{t("date")}</Label>
              <Input
                id="cb-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <Button size="lg" className="w-full" onClick={() => void save()}>
              {t("save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

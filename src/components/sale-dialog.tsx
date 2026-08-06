import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CustomerPicker } from "@/components/customer-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as db from "@/lib/db";
import { rs, todayIso, toDateInput, toNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { syncSaleLedger } from "@/lib/sale-khata";
import type { Customer, Item, PaymentMode, Sale, SaleLine } from "@/lib/types";
import { unitLabel } from "@/lib/units";
import { nextInvoiceNo, useCollection } from "@/lib/use-store";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass an existing sale to edit it instead of creating a new one. */
  editing?: Sale | undefined;
  onSaved?: (sale: Sale) => void;
};

/** Full-screen "Nai Sale" sheet: customer → items/amount → payment → date/note. */
export function SaleDialog({ open, onOpenChange, editing, onSaved }: Props) {
  const { t, lang } = useT();
  const items = useCollection<Item>("items");

  const [mode, setMode] = useState<PaymentMode>("cash");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [quickAmount, setQuickAmount] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<SaleLine[]>([]);
  const [tab, setTab] = useState<"quick" | "items">("quick");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);

  // Load (or reset) the form whenever the sheet opens.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setMode(editing.mode);
      setDate(toDateInput(new Date(editing.date)));
      setNote(editing.note ?? "");
      setQuickAmount(editing.entryMode === "quick" ? String(editing.total) : "");
      setCart(editing.lines ?? []);
      setTab(editing.entryMode);
      setCustomerId(editing.customerId ?? null);
      setCustomerName(editing.customerName ?? null);
    } else {
      setMode("cash");
      setDate(todayIso());
      setNote("");
      setQuickAmount("");
      setCart([]);
      setTab("quick");
      setCustomerId(null);
      setCustomerName(null);
    }
    setSearch("");
  }, [open, editing]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  }, [items, search]);

  const cartTotal = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
  const total = tab === "quick" ? toNumber(quickAmount) : cartTotal;

  function addToCart(item: Item) {
    setCart((prev) => {
      const idx = prev.findIndex((line) => line.itemId === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx]!, qty: next[idx]!.qty + 1 };
        return next;
      }
      return [
        ...prev,
        { itemId: item.id, name: item.name, unit: item.unit, price: item.price, qty: 1 },
      ];
    });
  }

  function setQty(itemId: string | null, qty: number) {
    setCart((prev) =>
      prev
        .map((line) => (line.itemId === itemId ? { ...line, qty } : line))
        .filter((line) => line.qty > 0),
    );
  }

  function pickCustomer(customer: Customer | null) {
    setCustomerId(customer?.id ?? null);
    setCustomerName(customer?.name ?? null);
  }

  async function handleSave() {
    if (total <= 0) {
      toast.error(t("amountRequired"));
      return;
    }
    // Udhaar has to be owed by somebody, otherwise it can never be recovered.
    if (mode === "credit" && !customerId) {
      toast.error(t("customerRequired"));
      return;
    }

    const isQuick = tab === "quick";
    const isoDate = new Date(
      `${date}T${(editing ? new Date(editing.date) : new Date()).toTimeString().slice(0, 8)}`,
    ).toISOString();

    let saved: Sale;
    if (editing) {
      saved = await db.put<Sale>("sales", {
        ...editing,
        date: isoDate,
        mode,
        entryMode: isQuick ? "quick" : "items",
        lines: isQuick ? [] : cart,
        total,
        note: note.trim(),
        customerId,
        customerName,
      });
    } else {
      const invoiceNo = await nextInvoiceNo();
      saved = (await db.insert<Omit<Sale, "createdAt" | "updatedAt">>("sales", {
        id: db.newId("sale"),
        deletedAt: null,
        invoiceNo,
        date: isoDate,
        mode,
        entryMode: isQuick ? "quick" : "items",
        lines: isQuick ? [] : cart,
        total,
        discount: 0,
        note: note.trim(),
        customerId,
        customerName,
      })) as Sale;
    }

    // Credit sale ⇒ mirror it into the customer's khata (and clean up if not).
    await syncSaleLedger(saved);

    toast.success(editing ? t("saleUpdated") : t("saleSaved"));
    onSaved?.(saved);
    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editing ? t("editSale") : t("newSale")}
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      <header className="safe-top flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button
          type="button"
          aria-label={t("back")}
          onClick={() => onOpenChange(false)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-lg font-bold">{editing ? t("editSale") : t("newSale")}</h2>
        <span className="tabular text-lg font-bold text-primary">{rs(total)}</span>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {/* 1 — Customer */}
        <section className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("customer")} {mode === "credit" ? "" : t("optional")}
          </Label>
          <CustomerPicker value={customerId} onChange={pickCustomer} />
        </section>

        {/* 2 — Amount or items */}
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
            {(["quick", "items"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setTab(v)}
                className={cn(
                  "rounded-xl py-2.5 text-sm font-bold transition-colors",
                  tab === v ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
                )}
              >
                {v === "quick" ? t("quickEntry") : t("myItems")}
              </button>
            ))}
          </div>

          {tab === "quick" ? (
            <Input
              id="quick-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={quickAmount}
              onChange={(event) => setQuickAmount(event.target.value)}
              className="tabular h-16 text-center text-3xl font-bold"
            />
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  autoComplete="off"
                  placeholder={t("searchItems")}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-12 pl-9"
                />
              </div>

              <div className="max-h-56 space-y-1.5 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">{t("noItems")}</p>
                ) : (
                  filtered.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addToCart(item)}
                      className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-3 py-3 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {unitLabel(item.unit, lang)}
                        </span>
                      </span>
                      <span className="tabular text-sm font-semibold text-primary">
                        {rs(item.price)}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className="space-y-2 rounded-2xl bg-muted p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {t("cart")}
                </p>
                {cart.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">{t("cartEmpty")}</p>
                ) : (
                  <ul className="space-y-2">
                    {cart.map((line) => (
                      <li key={line.itemId} className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {line.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="minus"
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card"
                            onClick={() => setQty(line.itemId, Math.max(0, line.qty - 1))}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="tabular w-8 text-center text-sm font-bold">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            aria-label="plus"
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card"
                            onClick={() => setQty(line.itemId, line.qty + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="tabular w-20 text-right text-sm font-semibold">
                          {rs(line.price * line.qty)}
                        </span>
                        <button
                          type="button"
                          aria-label={t("delete")}
                          className="p-1.5 text-destructive"
                          onClick={() => setQty(line.itemId, 0)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
                  <span>{t("total")}</span>
                  <span className="tabular">{rs(cartTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 3 — Payment mode */}
        <section className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("paymentMode")}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(["cash", "credit"] as PaymentMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-xl border px-3 py-3.5 text-base font-bold transition-colors",
                  mode === m
                    ? m === "cash"
                      ? "border-cash bg-cash text-cash-foreground"
                      : "border-credit bg-credit text-credit-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {m === "cash" ? t("cash") : t("credit")}
              </button>
            ))}
          </div>
          {mode === "credit" && !customerId ? (
            <p className="text-xs font-semibold text-destructive">{t("customerRequired")}</p>
          ) : null}
        </section>

        {/* 4 — Date + note */}
        <section className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="sale-date">{t("date")}</Label>
            <Input
              id="sale-date"
              type="date"
              className="h-12"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sale-note">{t("note")}</Label>
            <Input
              id="sale-note"
              type="text"
              className="h-12"
              autoComplete="off"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </section>
      </div>

      <div className="border-t border-border bg-card px-4 py-3">
        <Button className="h-14 w-full text-base" onClick={() => void handleSave()}>
          {t("saveSale")} · {rs(total)}
        </Button>
      </div>
    </div>
  );
}

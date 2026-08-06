import { useMemo, useState } from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as db from "@/lib/db";
import { rs, todayIso, toNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { Item, PaymentMode, Sale, SaleLine } from "@/lib/types";
import { unitLabel } from "@/lib/units";
import { nextInvoiceNo, useCollection } from "@/lib/use-store";
import { cn } from "@/lib/utils";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function SaleDialog({ open, onOpenChange }: Props) {
  const { t, lang } = useT();
  const items = useCollection<Item>("items");

  const [mode, setMode] = useState<PaymentMode>("cash");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [quickAmount, setQuickAmount] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<SaleLine[]>([]);
  const [tab, setTab] = useState<"quick" | "items">("quick");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  }, [items, search]);

  const cartTotal = cart.reduce((sum, line) => sum + line.price * line.qty, 0);

  function reset() {
    setMode("cash");
    setDate(todayIso());
    setNote("");
    setQuickAmount("");
    setSearch("");
    setCart([]);
    setTab("quick");
  }

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

  async function handleSave() {
    const isQuick = tab === "quick";
    const total = isQuick ? toNumber(quickAmount) : cartTotal;
    if (total <= 0) {
      toast.error(t("amountRequired"));
      return;
    }
    const invoiceNo = await nextInvoiceNo();
    await db.insert<Omit<Sale, "createdAt" | "updatedAt">>("sales", {
      id: db.newId("sale"),
      deletedAt: null,
      invoiceNo,
      date: new Date(`${date}T${new Date().toTimeString().slice(0, 8)}`).toISOString(),
      mode,
      entryMode: isQuick ? "quick" : "items",
      lines: isQuick ? [] : cart,
      total,
      discount: 0,
      note: note.trim(),
      customerId: null,
      customerName: null,
    });
    toast.success(t("saleSaved"));
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[92vh] max-w-sm flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t("newSale")}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "quick" | "items")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick">{t("quickEntry")}</TabsTrigger>
            <TabsTrigger value="items">{t("myItems")}</TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="mt-4 space-y-2">
            <Label htmlFor="quick-amount">{t("amount")}</Label>
            <Input
              id="quick-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={quickAmount}
              onChange={(event) => setQuickAmount(event.target.value)}
              className="tabular h-14 text-center text-2xl font-bold"
            />
          </TabsContent>

          <TabsContent value="items" className="mt-4 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                autoComplete="off"
                placeholder={t("searchItems")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-40 space-y-1.5 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">{t("noItems")}</p>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addToCart(item)}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-left"
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

            <div className="space-y-2 rounded-xl bg-muted p-3">
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
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card"
                          onClick={() => setQty(line.itemId, Math.max(0, line.qty - 1))}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        {/* Stepper AND free typing of quantity. */}
                        <Input
                          type="text"
                          inputMode="decimal"
                          aria-label={t("qty")}
                          value={String(line.qty)}
                          onChange={(event) => {
                            const raw = event.target.value;
                            setCart((prev) =>
                              prev.map((l) =>
                                l.itemId === line.itemId
                                  ? { ...l, qty: raw === "" ? 0 : toNumber(raw) }
                                  : l,
                              ),
                            );
                          }}
                          className="tabular h-8 w-14 px-1 text-center text-sm"
                        />
                        <button
                          type="button"
                          aria-label="plus"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card"
                          onClick={() => setQty(line.itemId, line.qty + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="tabular w-16 text-right text-sm font-semibold">
                        {rs(line.price * line.qty)}
                      </span>
                      <button
                        type="button"
                        aria-label={t("delete")}
                        className="p-1 text-destructive"
                        onClick={() => setQty(line.itemId, 0)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-bold">
                <span>{t("total")}</span>
                <span className="tabular">{rs(cartTotal)}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="space-y-2">
            <Label>{t("paymentMode")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["cash", "credit"] as PaymentMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors",
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sale-date">{t("date")}</Label>
              <Input
                id="sale-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-note">{t("note")}</Label>
              <Input
                id="sale-note"
                type="text"
                autoComplete="off"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
          </div>

          <Button className="h-12 w-full text-base" onClick={() => void handleSave()}>
            {t("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

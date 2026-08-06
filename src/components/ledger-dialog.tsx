import { useState } from "react";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";

import { AmountKeypad, evalExpression } from "@/components/amount-keypad";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as db from "@/lib/db";
import { rs, todayIso, toNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { LedgerEntry } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  kind: "diye" | "liye";
};

export function LedgerDialog({ open, onOpenChange, customerId, kind }: Props) {
  const { t } = useT();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayIso());
  const [reminder, setReminder] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  function reset() {
    setAmount("");
    setNote("");
    setDate(todayIso());
    setReminder("");
    setPhoto(null);
  }

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  async function save() {
    const value = toNumber(amount);
    if (value <= 0) {
      toast.error(t("amountRequired"));
      return;
    }
    await db.insert<Omit<LedgerEntry, "createdAt" | "updatedAt">>("ledger", {
      id: db.newId("led"),
      customerId,
      kind,
      amount: value,
      date: new Date(`${date}T12:00:00`).toISOString(),
      note: note.trim(),
      photo,
      reminderDate: reminder ? new Date(`${reminder}T12:00:00`).toISOString() : null,
    });
    toast.success(t("saved"));
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
      <DialogContent className="flex max-h-[92svh] max-w-sm flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className={kind === "diye" ? "text-credit" : "text-cash"}>
            {kind === "diye" ? t("iGave") : t("iReceived")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="led-amount">{t("amount")}</Label>
            <Input
              id="led-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="tabular h-12 text-center text-xl font-bold"
            />
            <p className="tabular text-center text-xs text-muted-foreground">
              {rs(evalExpression(amount))}
            </p>
          </div>

          <AmountKeypad value={amount} onChange={setAmount} />

          <div className="space-y-1.5">
            <Label htmlFor="led-note">{t("note")}</Label>
            <Input id="led-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="led-date">{t("date")}</Label>
              <Input
                id="led-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="tabular h-11 w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="led-rem">{t("setReminder")}</Label>
              <Input
                id="led-rem"
                type="date"
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className="tabular h-11 w-full"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="led-photo">{t("attachPhoto")}</Label>
            {photo ? (
              <div className="relative">
                <img src={photo} alt={t("attachPhoto")} className="h-32 w-full rounded-xl object-cover" />
                <button
                  type="button"
                  aria-label="remove photo"
                  onClick={() => setPhoto(null)}
                  className="absolute right-2 top-2 rounded-full bg-foreground/70 p-1 text-background"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex h-16 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                <Camera className="h-4 w-4" />
                {t("attachPhoto")}
                <input
                  id="led-photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => pickPhoto(e.target.files?.[0])}
                />
              </label>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-background px-4 py-3">
          <Button size="lg" className="w-full" onClick={() => void save()}>
            {t("save")}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}

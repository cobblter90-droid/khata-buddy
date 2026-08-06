import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as db from "@/lib/db";
import { toNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { Item } from "@/lib/types";
import { isKnownUnit, UNIT_GROUP_LABEL, UNITS, type UnitDef } from "@/lib/units";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Item | undefined;
};

const GROUP_ORDER: UnitDef["group"][] = [
  "count",
  "weight",
  "volume",
  "pack",
  "length",
  "area",
  "time",
];

export function ItemDialog({ open, onOpenChange, editing }: Props) {
  const { t, lang } = useT();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("piece");
  const [customUnit, setCustomUnit] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setName(editing.name);
      setPrice(String(editing.price ?? ""));
      const known = isKnownUnit(editing.unit);
      setUseCustom(!known);
      setUnit(known ? (editing.unit ?? "piece") : "piece");
      setCustomUnit(known ? "" : (editing.unit ?? ""));
    } else {
      setName("");
      setPrice("");
      setUnit("piece");
      setCustomUnit("");
      setUseCustom(false);
    }
  }, [open, editing]);

  const finalUnit = useCustom ? customUnit.trim() : unit;
  const unitUnknown = finalUnit.length > 0 && !isKnownUnit(finalUnit);

  async function handleSave() {
    if (!name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    const payload = {
      name: name.trim(),
      price: toNumber(price),
      unit: finalUnit || "piece",
      unitUnknown,
    };
    if (editing) await db.put<Item>("items", { ...editing, ...payload });
    else await db.insert("items", { id: db.newId("item"), deletedAt: null, ...payload });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? t("edit") : t("addItem")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">{t("itemName")}</Label>
            <Input
              id="item-name"
              type="text"
              value={name}
              autoComplete="off"
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-price">{t("price")}</Label>
            <Input
              id="item-price"
              type="text"
              inputMode="decimal"
              value={price}
              autoComplete="off"
              onChange={(event) => setPrice(event.target.value)}
              className="tabular"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-unit">{t("unit")}</Label>
            <select
              id="item-unit"
              className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base text-card-foreground"
              value={useCustom ? "__other__" : unit}
              onChange={(event) => {
                if (event.target.value === "__other__") {
                  setUseCustom(true);
                } else {
                  setUseCustom(false);
                  setUnit(event.target.value);
                }
              }}
            >
              {GROUP_ORDER.map((group) => (
                <optgroup key={group} label={UNIT_GROUP_LABEL[group][lang]}>
                  {UNITS.filter((u) => u.group === group).map((u) => (
                    <option key={u.id} value={u.id}>
                      {lang === "en" ? u.en : u.ur}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="__other__">{t("unitOther")}</option>
            </select>
          </div>

          {useCustom ? (
            <div className="space-y-2">
              <Label htmlFor="item-unit-custom">{t("unitOther")}</Label>
              <Input
                id="item-unit-custom"
                type="text"
                value={customUnit}
                autoComplete="off"
                onChange={(event) => setCustomUnit(event.target.value)}
              />
            </div>
          ) : null}

          {unitUnknown ? (
            <p className="flex items-start gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {t("unitUnknownWarn")}
            </p>
          ) : null}

          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={() => void handleSave()}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

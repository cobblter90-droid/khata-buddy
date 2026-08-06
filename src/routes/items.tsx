import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ItemDialog } from "@/components/item-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as db from "@/lib/db";
import { rs } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { Item } from "@/lib/types";
import { unitLabel } from "@/lib/units";
import { useCollection } from "@/lib/use-store";


export const Route = createFileRoute("/items")({
  head: () => ({
    meta: [
      { title: "Item Catalog — Rates & Units | Assan Khata By U&R" },
      {
        name: "description",
        content:
          "Save your shop items with price and unit (Piece, Kg, Bori, Carton, Litre and more) for one-tap billing, fully offline.",
      },
      { property: "og:title", content: "Item Catalog | Assan Khata" },
      {
        property: "og:description",
        content: "Build your shop's item list with rates and retail units in Assan Khata By U&R.",
      },
    ],
  }),
  component: ItemsPage,
});

function ItemsPage() {
  const { t, lang } = useT();
  const items = useCollection<Item>("items");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Item | undefined>(undefined);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return items.slice(-5).reverse();
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, q]);


  return (
    <div className="px-4 pb-6">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-xl font-bold">{t("itemsTitle")}</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("addItem")}
        </Button>
      </header>

      {items.length > 0 ? (
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 pl-9"
            autoComplete="off"
            placeholder={t("searchItems")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          {t("noItems")}
        </p>
      ) : !q ? null : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          {t("noItemMatch")}
        </p>
      ) : (

        <ul className="space-y-2">
          {filtered.map((item) => (

            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-card-foreground">{item.name}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{unitLabel(item.unit, lang)}</span>
                  {item.unitUnknown ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-brass" aria-label="unknown unit" />
                  ) : null}
                </p>
              </div>
              <span className="tabular font-semibold text-primary">{rs(item.price)}</span>
              <button
                type="button"
                aria-label={t("edit")}
                className="rounded-lg p-2 text-muted-foreground"
                onClick={() => {
                  setEditing(item);
                  setDialogOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={t("delete")}
                className="rounded-lg p-2 text-destructive"
                onClick={() => {
                  void db.softDelete("items", item.id);
                  toast.success(t("deleted"));
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ItemDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
    </div>
  );
}

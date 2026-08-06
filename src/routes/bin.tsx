import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { COLLECTIONS, type BaseDoc, type Collection } from "@/lib/db";
import * as db from "@/lib/db";
import { formatDateTime, rs } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { useAllDocs } from "@/lib/use-store";

export const Route = createFileRoute("/bin")({
  head: () => ({
    meta: [
      { title: "Deleted Items — Recycle Bin | Assan Khata By U&R" },
      {
        name: "description",
        content:
          "Restore accidentally deleted sales, items, customers and khata entries from Assan Khata's offline recycle bin.",
      },
      { property: "og:title", content: "Deleted Items | Assan Khata" },
      { property: "og:description", content: "Nothing is lost — restore deleted entries anytime." },
    ],
  }),
  component: BinPage,
});

type Row = BaseDoc & { collection: Collection; label: string; amount?: number | undefined };

function labelOf(collection: Collection, doc: Record<string, unknown>): string {
  const name = doc["name"] ?? doc["invoiceNo"] ?? doc["note"] ?? doc["kind"];
  return typeof name === "string" && name ? name : String(doc["id"] ?? "—");
}

function BinPage() {
  const { t } = useT();
  const rows: Row[] = COLLECTIONS.filter((c) => c !== "settings").flatMap((collection) =>
    (useAllDocsSafe(collection) as (BaseDoc & Record<string, unknown>)[])
      .filter((d) => d.deletedAt)
      .map((d) => ({
        ...d,
        collection,
        label: labelOf(collection, d),
        amount: typeof d["amount"] === "number" ? d["amount"] : typeof d["total"] === "number" ? d["total"] : undefined,
      })),
  ).sort((a, b) => ((a.deletedAt ?? "") < (b.deletedAt ?? "") ? 1 : -1));

  return (
    <div className="px-4 pb-6">
      <header className="flex items-center gap-2 py-4">
        <Link to="/account" aria-label={t("back")} className="rounded-lg p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">{t("deletedItems")}</h1>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          {t("emptyBin")}
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={`${row.collection}-${row.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{row.label}</p>
                <p className="text-xs text-muted-foreground">
                  {row.collection} · {formatDateTime(row.deletedAt)}
                </p>
              </div>
              {row.amount !== undefined ? (
                <span className="tabular text-sm font-semibold">{rs(row.amount)}</span>
              ) : null}
              <button
                type="button"
                aria-label={t("restore")}
                className="rounded-lg p-2 text-primary"
                onClick={() => {
                  void db.restore(row.collection, row.id);
                  toast.success(t("restore"));
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={t("deleteForever")}
                className="rounded-lg p-2 text-destructive"
                onClick={() => {
                  void db.hardDelete(row.collection, row.id);
                  toast.success(t("deleted"));
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Hook order stays stable because COLLECTIONS is a module-level constant. */
function useAllDocsSafe(collection: Collection) {
  return useAllDocs<BaseDoc>(collection);
}

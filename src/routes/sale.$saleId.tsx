import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, Pencil, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { LOGO_URL } from "@/components/logo";
import { SaleDialog } from "@/components/sale-dialog";
import { Button } from "@/components/ui/button";
import { BILL_FOOTER } from "@/lib/constants";
import { formatDateTime, rs } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { deleteSaleWithLedger } from "@/lib/sale-khata";
import { shareNodeAsImage } from "@/lib/share";
import type { Sale } from "@/lib/types";
import { unitLabel } from "@/lib/units";
import { useDoc, useSettings } from "@/lib/use-store";

export const Route = createFileRoute("/sale/$saleId")({
  head: () => ({
    meta: [
      { title: "Bill Details | Assan Khata By U&R" },
      {
        name: "description",
        content:
          "Itemised bill view with cash/credit mode, totals and one-tap image sharing through your phone's share sheet.",
      },
      { property: "og:title", content: "Bill Details | Assan Khata" },
      {
        property: "og:description",
        content: "View and share an itemised shop bill from Assan Khata By U&R.",
      },
    ],
  }),
  component: SaleInvoicePage,
});

function SaleInvoicePage() {
  const { saleId } = Route.useParams();
  const { t, lang } = useT();
  const sale = useDoc<Sale>("sales", saleId);
  const settings = useSettings();
  const billRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);

  if (!sale) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">{t("saleNotFound")}</p>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary">
          {t("back")}
        </Link>
      </div>
    );
  }

  async function share() {
    const node = billRef.current;
    if (!node || !sale) return;
    try {
      const title = `${sale.invoiceNo} — ${settings.businessName || "Assan Khata"}`;
      // JPG through the OS share sheet: WhatsApp, SMS, email — user's choice.
      await shareNodeAsImage(node, sale.invoiceNo, title, "jpeg");
    } catch (err) {
      console.error(err);
      toast.error("Share nahi ho saka.");
    }
  }

  const subtotal = sale.lines.length
    ? sale.lines.reduce((sum, l) => sum + l.price * l.qty, 0)
    : sale.total;

  return (
    <div className="px-4 pb-8">
      <header className="flex items-center gap-2 py-4">
        <Link
          to="/"
          aria-label={t("back")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-bold">{t("invoice")}</h1>
      </header>

      {/* Printable / shareable bill surface — white on purpose so the exported
          image and PDF look like a real receipt. */}
      <div ref={billRef} className="rounded-2xl bg-card p-5 text-card-foreground shadow-card">
        <div className="text-center">
          <img
            src={settings.logo || LOGO_URL}
            alt={settings.businessName || "Assan Khata"}
            className="mx-auto mb-2 h-14 w-14 rounded-xl object-contain"
          />
          <p className="text-lg font-bold">{settings.businessName || t("appName")}</p>
          {settings.businessPhone ? (
            <p className="text-xs text-muted-foreground">{settings.businessPhone}</p>
          ) : null}
          {settings.businessAddress ? (
            <p className="text-xs text-muted-foreground">{settings.businessAddress}</p>
          ) : null}
        </div>

        <div className="mt-4 flex justify-between border-y border-border py-2 text-xs">
          <span>
            <span className="font-semibold">{t("invoiceNo")}</span> {sale.invoiceNo}
          </span>
          <span>{formatDateTime(sale.date)}</span>
        </div>

        {sale.lines.length > 0 ? (
          <table className="mt-3 w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-1 font-semibold">{t("item")}</th>
                <th className="pb-1 text-center font-semibold">{t("qty")}</th>
                <th className="pb-1 text-right font-semibold">{t("rate")}</th>
                <th className="pb-1 text-right font-semibold">{t("total")}</th>
              </tr>
            </thead>
            <tbody>
              {sale.lines.map((line, index) => (
                <tr key={`${line.itemId}-${index}`} className="border-t border-border">
                  <td className="py-1.5 pr-2">
                    {line.name}
                    <span className="block text-[10px] text-muted-foreground">
                      {unitLabel(line.unit, lang)}
                    </span>
                  </td>
                  <td className="tabular py-1.5 text-center">{line.qty}</td>
                  <td className="tabular py-1.5 text-right">{rs(line.price)}</td>
                  <td className="tabular py-1.5 text-right">{rs(line.price * line.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">{t("quickEntry")}</p>
        )}

        {sale.note ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {t("note")}: {sale.note}
          </p>
        ) : null}

        <div className="mt-3 space-y-1 border-t border-border pt-2 text-sm">
          <Row label={t("total")} value={rs(subtotal)} />
          {sale.discount > 0 ? <Row label={t("discount")} value={`- ${rs(sale.discount)}`} /> : null}
          <div className="flex justify-between text-base font-bold">
            <span>{t("grandTotal")}</span>
            <span className="tabular">{rs(sale.total)}</span>
          </div>
          {sale.customerName ? (
            <div className="flex justify-between text-xs">
              <span>{t("customer")}</span>
              <span className="font-bold">{sale.customerName}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-xs">
            <span>{t("paymentMode")}</span>
            <span className="font-bold">{sale.mode === "cash" ? t("cash") : t("credit")}</span>
          </div>
        </div>

        <p className="mt-5 border-t border-border pt-3 text-center text-[10px] font-semibold leading-relaxed text-muted-foreground">
          {BILL_FOOTER}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <Button className="h-12 w-full text-base" onClick={() => void share()}>
          <Share2 className="mr-2 h-4 w-4" />
          {t("shareInvoice")}
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("editSale")}
          </Button>
          <Button
            variant="outline"
            className="h-12 border-destructive/40 text-destructive"
            onClick={() => {
              void (async () => {
                await deleteSaleWithLedger(sale!.id);
                toast.success(t("saleDeleted"));
                window.history.back();
              })();
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("deleteSale")}
          </Button>
        </div>
      </div>

      <SaleDialog open={editing} onOpenChange={setEditing} editing={sale} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}

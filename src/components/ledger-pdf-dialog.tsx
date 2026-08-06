/**
 * Customer ledger statement export: full khata or a custom date range,
 * rendered to a printable sheet and exported as a JPG image.
 */
import { useMemo, useRef, useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { LOGO_URL } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BILL_FOOTER } from "@/lib/constants";
import { formatDate, rs, todayIso } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { shareNodeAsImage } from "@/lib/share";
import type { Customer, LedgerEntry } from "@/lib/types";
import { useSettings } from "@/lib/use-store";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  entries: LedgerEntry[];
};

export function LedgerPdfDialog({ open, onOpenChange, customer, entries }: Props) {
  const { t } = useT();
  const settings = useSettings();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"all" | "range">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(todayIso());
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const asc = [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    if (mode === "all") return asc;
    return asc.filter((e) => {
      const day = e.date.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [entries, mode, from, to]);

  let running = 0;
  const withBalance = rows.map((e) => {
    running += e.kind === "diye" ? e.amount : -e.amount;
    return { entry: e, balance: running };
  });
  const totalDiye = rows.reduce((s, e) => s + (e.kind === "diye" ? e.amount : 0), 0);
  const totalLiye = rows.reduce((s, e) => s + (e.kind === "liye" ? e.amount : 0), 0);
  const closing = totalDiye - totalLiye;

  async function download() {
    const node = sheetRef.current;
    if (!node) return;
    if (rows.length === 0) {
      toast.error(t("noTransactions"));
      return;
    }
    setBusy(true);
    try {
      const name = `${customer.name.replace(/\s+/g, "-")}-khata`;
      await shareNodeAsImage(node, name, `${customer.name} — ${t("ledgerPdf")}`, "jpeg");
      toast.success(t("saved"));
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(t("pdfFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("ledgerPdf")}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {(["all", "range"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-xl border px-3 py-3 text-sm font-semibold",
                mode === m ? "border-primary bg-primary/10 text-primary" : "border-border bg-card",
              )}
            >
              {m === "all" ? t("wholeKhata") : t("customDates")}
            </button>
          ))}
        </div>

        {mode === "range" ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pdf-from">{t("fromDate")}</Label>
              <Input id="pdf-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pdf-to">{t("toDate")}</Label>
              <Input id="pdf-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          {rows.length} {t("transactions")}
        </p>

        <Button size="lg" disabled={busy} onClick={() => void download()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
          {t("downloadPdf")}
        </Button>
      </DialogContent>

      {/* Off-screen printable statement */}
      <div className="pointer-events-none fixed -left-[3000px] top-0" aria-hidden>
        <div ref={sheetRef} style={{ width: 760, background: "#ffffff", color: "#111827", padding: 28 }}>
          <div style={{ textAlign: "center" }}>
            <img
              src={LOGO_URL}
              alt=""
              style={{ height: 56, width: 56, objectFit: "contain", margin: "0 auto 8px" }}
            />
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {settings.businessName || t("appName")}
            </div>
            {settings.businessPhone ? (
              <div style={{ fontSize: 12, color: "#6b7280" }}>{settings.businessPhone}</div>
            ) : null}
            {settings.businessAddress ? (
              <div style={{ fontSize: 12, color: "#6b7280" }}>{settings.businessAddress}</div>
            ) : null}
          </div>

          <div
            style={{
              marginTop: 16,
              paddingTop: 10,
              paddingBottom: 10,
              borderTop: "1px solid #e5e7eb",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <div>
              <strong>{customer.name}</strong>
              {customer.phone ? <div style={{ color: "#6b7280" }}>{customer.phone}</div> : null}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700 }}>{t("ledgerPdf")}</div>
              <div style={{ color: "#6b7280" }}>
                {mode === "all"
                  ? t("wholeKhata")
                  : `${from ? formatDate(from) : "—"} → ${to ? formatDate(to) : "—"}`}
              </div>
            </div>
          </div>

          <table style={{ width: "100%", marginTop: 14, fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#6b7280", textAlign: "left" }}>
                <th style={{ padding: "6px 4px" }}>{t("date")}</th>
                <th style={{ padding: "6px 4px" }}>{t("note")}</th>
                <th style={{ padding: "6px 4px", textAlign: "right" }}>{t("iGave")}</th>
                <th style={{ padding: "6px 4px", textAlign: "right" }}>{t("iReceived")}</th>
                <th style={{ padding: "6px 4px", textAlign: "right" }}>{t("balance")}</th>
              </tr>
            </thead>
            <tbody>
              {withBalance.map(({ entry, balance }) => (
                <tr key={entry.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "6px 4px", whiteSpace: "nowrap" }}>{formatDate(entry.date)}</td>
                  <td style={{ padding: "6px 4px" }}>{entry.note || (entry.saleId ? t("fromSale") : "—")}</td>
                  <td style={{ padding: "6px 4px", textAlign: "right" }}>
                    {entry.kind === "diye" ? rs(entry.amount) : "—"}
                  </td>
                  <td style={{ padding: "6px 4px", textAlign: "right" }}>
                    {entry.kind === "liye" ? rs(entry.amount) : "—"}
                  </td>
                  <td style={{ padding: "6px 4px", textAlign: "right", fontWeight: 600 }}>
                    {rs(Math.abs(balance))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              marginTop: 14,
              paddingTop: 10,
              borderTop: "1px solid #e5e7eb",
              fontSize: 13,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              {t("iGave")}: <strong>{rs(totalDiye)}</strong> · {t("iReceived")}:{" "}
              <strong>{rs(totalLiye)}</strong>
            </span>
            <span style={{ fontWeight: 700 }}>
              {closing >= 0 ? t("toGet") : t("toGive")}: {rs(Math.abs(closing))}
            </span>
          </div>

          <div style={{ marginTop: 18, textAlign: "center", fontSize: 10, color: "#9ca3af" }}>
            {BILL_FOOTER}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

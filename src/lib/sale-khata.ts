/**
 * Keeps a credit ("udhaar") sale and the customer's khata ledger in sync.
 *
 * Rule: mode === "credit" + a customer attached ⇒ exactly one ledger entry of
 * kind "diye" (customer owes me) linked back to the sale via `saleId`.
 * Cash sales, or credit sales without a customer, own no ledger entry.
 */
import * as db from "./db";
import type { LedgerEntry, Sale } from "./types";

export function ledgerEntryForSale(saleId: string): LedgerEntry | undefined {
  return db.listAll<LedgerEntry>("ledger").find((e) => e.saleId === saleId && !e.deletedAt);
}

export function isSaleEntry(entry: LedgerEntry): boolean {
  return Boolean(entry.saleId);
}

export async function syncSaleLedger(sale: Sale): Promise<void> {
  const existing = ledgerEntryForSale(sale.id);
  const shouldExist = sale.mode === "credit" && Boolean(sale.customerId) && !sale.deletedAt;

  if (!shouldExist) {
    if (existing) await db.softDelete("ledger", existing.id);
    return;
  }

  const patch = {
    customerId: sale.customerId!,
    kind: "diye" as const,
    amount: sale.total,
    date: sale.date,
    note: sale.note ? `${sale.invoiceNo} · ${sale.note}` : sale.invoiceNo,
    saleId: sale.id,
    deletedAt: null,
  };

  if (existing) {
    await db.put<LedgerEntry>("ledger", { ...existing, ...patch });
    return;
  }

  await db.insert<Omit<LedgerEntry, "createdAt" | "updatedAt">>("ledger", {
    id: db.newId("led"),
    photo: null,
    reminderDate: null,
    ...patch,
  });
}

/** Soft-deletes a sale and the ledger entry it created, so nothing is orphaned. */
export async function deleteSaleWithLedger(saleId: string): Promise<void> {
  const entry = ledgerEntryForSale(saleId);
  if (entry) await db.softDelete("ledger", entry.id);
  await db.softDelete("sales", saleId);
}

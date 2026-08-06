/**
 * Customer ledger maths. Pure functions over the local docs — no network.
 *
 * Convention: "diye" (I gave) increases what the customer owes me,
 * "liye" (I received) decreases it. So a POSITIVE balance = "maine lene hain".
 */
import * as db from "./db";
import { isOverdue } from "./format";
import type { Customer, LedgerEntry } from "./types";

export function entriesFor(customerId: string): LedgerEntry[] {
  return db
    .list<LedgerEntry>("ledger")
    .filter((e) => e.customerId === customerId)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.createdAt < b.createdAt ? 1 : -1));
}

export function balanceOf(customerId: string, all?: LedgerEntry[]): number {
  const list = all ? all.filter((e) => e.customerId === customerId) : entriesFor(customerId);
  return list.reduce((sum, e) => sum + (e.kind === "diye" ? e.amount : -e.amount), 0);
}

export type KhataTotals = { toGet: number; toGive: number };

export function totals(customers: Customer[], entries: LedgerEntry[]): KhataTotals {
  let toGet = 0;
  let toGive = 0;
  for (const c of customers) {
    const bal = balanceOf(c.id, entries);
    if (bal > 0) toGet += bal;
    else if (bal < 0) toGive += -bal;
  }
  return { toGet, toGive };
}

/** Customers whose reminder date (or any entry's reminder) has passed. */
export function overdueCustomers(customers: Customer[], entries: LedgerEntry[]): Customer[] {
  return customers.filter((c) => {
    if (balanceOf(c.id, entries) <= 0) return false;
    if (isOverdue(c.reminderDate)) return true;
    return entries.some((e) => e.customerId === c.id && isOverdue(e.reminderDate));
  });
}

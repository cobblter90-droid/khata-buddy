import type { BaseDoc } from "./db";

export type PaymentMode = "cash" | "credit";

export type SaleLine = {
  itemId: string | null;
  name: string;
  unit: string;
  price: number;
  qty: number;
};

export type Sale = BaseDoc & {
  /** Human readable bill number, e.g. INV-0007 */
  invoiceNo: string;
  date: string;
  mode: PaymentMode;
  /** Quick entry ("foree") has no line items. */
  entryMode: "quick" | "items";
  lines: SaleLine[];
  total: number;
  discount: number;
  note?: string;
  customerId?: string | null;
  customerName?: string | null;
};

export type Item = BaseDoc & {
  name: string;
  price: number;
  unit: string;
  /** Set when the saved unit is not part of the known unit set. */
  unitUnknown?: boolean;
};

export type Customer = BaseDoc & {
  name: string;
  phone: string;
  source: "manual" | "contacts";
  reminderDate?: string | null;
  note?: string;
};

/** "diye" = I gave (customer owes me more) · "liye" = I received. */
export type LedgerEntry = BaseDoc & {
  customerId: string;
  kind: "diye" | "liye";
  amount: number;
  date: string;
  note?: string;
  /** Base64 data URL of an attached bill photo. Stored locally only. */
  photo?: string | null;
  reminderDate?: string | null;
};

export type CashbookEntry = BaseDoc & {
  kind: "in" | "out";
  amount: number;
  date: string;
  note?: string;
};

export type Settings = BaseDoc & {
  id: "app";
  language: "ur" | "en";
  businessName: string;
  businessPhone: string;
  businessAddress: string;
  logo?: string | null;
  pinEnabled: boolean;
  pin?: string | null;
  invoiceCounter: number;
};

export type PeriodKey = "week" | "month" | "custom";

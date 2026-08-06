import type { PeriodKey } from "./types";

export function money(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return n.toLocaleString("en-PK", { maximumFractionDigits: 2 });
}

export function rs(value: number): string {
  return `Rs ${money(value)}`;
}

/** Parses free-typed numeric input without ever throwing or NaN-ing the UI. */
export function toNumber(input: string | number | null | undefined): number {
  if (typeof input === "number") return Number.isFinite(input) ? input : 0;
  if (!input) return 0;
  const cleaned = String(input).replace(/[^0-9.-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function todayIso(): string {
  const d = new Date();
  return toDateInput(d);
}

export function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${formatDate(iso)} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export type Range = { start: Date; end: Date };

export function periodRange(period: PeriodKey, customFrom?: string, customTo?: string): Range {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (period === "week") start.setDate(start.getDate() - 6);
  else if (period === "month") start.setDate(start.getDate() - 29);
  else {
    if (customFrom) {
      const d = new Date(`${customFrom}T00:00:00`);
      if (!Number.isNaN(d.getTime())) start.setTime(d.getTime());
    } else {
      start.setDate(start.getDate() - 29);
    }
    if (customTo) {
      const d = new Date(`${customTo}T23:59:59`);
      if (!Number.isNaN(d.getTime())) end.setTime(d.getTime());
    }
  }
  return { start, end };
}

export function inRange(iso: string, range: Range): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return t >= range.start.getTime() && t <= range.end.getTime();
}

export function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

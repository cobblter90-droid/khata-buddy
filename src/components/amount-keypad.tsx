import { Delete } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  /** Hide the +, −, × keys (used by the PIN pad). */
  digitsOnly?: boolean;
};

const OPS = ["+", "-", "*"];

/**
 * Evaluates a simple calculator expression made of numbers and + − ×.
 * Never throws — invalid input just yields 0.
 */
export function evalExpression(input: string): number {
  if (!input) return 0;
  const cleaned = input.replace(/[^0-9.+\-*]/g, "").replace(/[+\-*]+$/, "");
  if (!cleaned) return 0;
  const tokens = cleaned.match(/(\d+(\.\d*)?|\.\d+|[+\-*])/g);
  if (!tokens) return 0;

  // multiply first
  const flat: (number | string)[] = [];
  for (const tk of tokens) {
    if (OPS.includes(tk)) {
      flat.push(tk);
      continue;
    }
    const n = parseFloat(tk);
    if (!Number.isFinite(n)) return 0;
    if (flat[flat.length - 1] === "*") {
      flat.pop();
      const prev = flat.pop();
      flat.push((typeof prev === "number" ? prev : 0) * n);
    } else {
      flat.push(n);
    }
  }

  let total = typeof flat[0] === "number" ? flat[0] : 0;
  for (let i = 1; i < flat.length; i += 2) {
    const op = flat[i];
    const next = flat[i + 1];
    const n = typeof next === "number" ? next : 0;
    if (op === "+") total += n;
    else if (op === "-") total -= n;
  }
  return Number.isFinite(total) ? total : 0;
}

/**
 * Calculator keypad for amount entry. It only edits a plain string that
 * the parent also renders in a normal <input>, so the native keyboard still
 * works — the keypad is an addition, never a replacement.
 */
export function AmountKeypad({ value, onChange, className, digitsOnly = false }: Props) {
  const keys = digitsOnly
    ? ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"]
    : ["1", "2", "3", "*", "4", "5", "6", "-", "7", "8", "9", "+", ".", "0", "del", "="];

  function press(key: string) {
    const last = value.slice(-1);

    if (key === "del") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === "=") {
      const result = evalExpression(value);
      onChange(result ? String(Number(result.toFixed(2))) : "");
      return;
    }
    if (OPS.includes(key)) {
      if (!value) return;
      if (OPS.includes(last)) {
        onChange(value.slice(0, -1) + key);
        return;
      }
      onChange(value + key);
      return;
    }
    if (key === ".") {
      const current = value.split(/[+\-*]/).pop() ?? "";
      if (current.includes(".")) return;
      if (current === "") {
        onChange(value + "0.");
        return;
      }
    }
    const currentNum = (value.split(/[+\-*]/).pop() ?? "").replace(/[^0-9]/g, "");
    if (currentNum.length >= 10) return;
    onChange(value + key);
  }

  const label: Record<string, string> = { "*": "×", "-": "−", "+": "+", "=": "=" };

  return (
    <div className={cn("grid gap-1.5", digitsOnly ? "grid-cols-3" : "grid-cols-4", className)}>
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          aria-label={key === "del" ? "backspace" : key}
          onClick={() => press(key)}
          className={cn(
            "tabular flex h-11 items-center justify-center rounded-xl border border-border bg-card text-lg font-semibold text-card-foreground active:scale-[0.97]",
            key === "del" && "text-destructive",
            OPS.includes(key) && "bg-secondary text-secondary-foreground",
            key === "=" && "bg-primary text-primary-foreground",
          )}
        >
          {key === "del" ? <Delete className="h-5 w-5" /> : (label[key] ?? key)}
        </button>
      ))}
    </div>
  );
}

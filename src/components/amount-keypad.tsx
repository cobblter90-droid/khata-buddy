import { Delete } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (next: string) => void;
  className?: string;
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"] as const;

/**
 * Calculator-style keypad for amount entry. It only edits a plain string that
 * the parent also renders in a normal <input>, so the native keyboard still
 * works — the keypad is an addition, never a replacement.
 */
export function AmountKeypad({ value, onChange, className }: Props) {
  function press(key: string) {
    if (key === "del") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === "." && value.includes(".")) return;
    if (key === "." && value === "") {
      onChange("0.");
      return;
    }
    if (value.replace(/[^0-9]/g, "").length >= 10) return;
    onChange(value + key);
  }

  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          aria-label={key === "del" ? "backspace" : key}
          onClick={() => press(key)}
          className={cn(
            "tabular flex h-12 items-center justify-center rounded-xl border border-border bg-card text-lg font-semibold text-card-foreground active:scale-[0.97]",
            key === "del" && "text-destructive",
          )}
        >
          {key === "del" ? <Delete className="h-5 w-5" /> : key}
        </button>
      ))}
    </div>
  );
}

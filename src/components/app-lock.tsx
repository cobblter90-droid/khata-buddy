import { useState } from "react";
import { LockKeyhole } from "lucide-react";

import { AmountKeypad } from "@/components/amount-keypad";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

type Props = { pin: string; onUnlock: () => void };

export function AppLock({ pin, onUnlock }: Props) {
  const { t } = useT();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function submit() {
    if (value === pin) {
      onUnlock();
      return;
    }
    setError(true);
    setValue("");
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-background px-6 py-10">
      <div className="mx-auto w-full max-w-xs text-center">
        <Logo className="mx-auto mb-4 h-20 w-20 rounded-3xl shadow-raised" />
        <h1 className="flex items-center justify-center gap-2 text-lg font-bold">
          <LockKeyhole className="h-4 w-4" />
          {t("appLock")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("pinEnter")}</p>

        <p className="tabular mt-6 h-10 text-3xl font-bold tracking-[0.4em]">
          {"•".repeat(value.length)}
        </p>
        {error ? <p className="text-sm font-medium text-destructive">{t("pinWrong")}</p> : null}

        <AmountKeypad
          digitsOnly
          value={value}
          onChange={(next) => {
            setError(false);
            setValue(next.replace(/[^0-9]/g, "").slice(0, 8));
          }}
          className="mt-4"
        />

        <Button size="lg" className="mt-4 w-full" onClick={submit} disabled={value.length < 4}>
          {t("unlock")}
        </Button>
      </div>
    </div>
  );
}

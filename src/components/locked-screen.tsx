import { Lock } from "lucide-react";

import { SUPPORT_LINE } from "@/lib/constants";
import { useT } from "@/lib/i18n";

/** Full-screen, non-dismissable block for a locked license. */
export function LockedScreen() {
  const { t } = useT();
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-primary px-6 text-center text-primary-foreground">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-foreground/15">
        <Lock className="h-9 w-9" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">{t("lockedTitle")}</h1>
      <p className="mt-3 max-w-xs text-sm opacity-90">{t("lockedBody")}</p>
      <p className="mt-5 rounded-xl bg-primary-foreground/12 px-4 py-3 text-base font-semibold">
        {SUPPORT_LINE}
      </p>
    </div>
  );
}

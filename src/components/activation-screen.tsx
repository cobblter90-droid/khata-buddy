import { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPPORT_LINE } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import { checkLicense, clearLicenseKey, storeLicenseKey } from "@/lib/license";

type Props = {
  onActivated: () => void;
  onLocked: () => void;
};

export function ActivationScreen({ onActivated, onLocked }: Props) {
  const { t } = useT();
  const [licenseKey, setLicenseKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Plain derived boolean from state — never a ref or async flag, so the button
  // can never get stuck disabled once the field has text.
  const canSubmit = licenseKey.trim().length > 0 && !busy;

  async function handleActivate() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const result = await checkLicense(licenseKey);
    setBusy(false);

    if (result.status === "active") {
      await storeLicenseKey(licenseKey.trim());
      onActivated();
      return;
    }
    if (result.status === "locked") {
      await storeLicenseKey(licenseKey.trim());
      onLocked();
      return;
    }
    if (result.status === "offline") {
      setError(t("licenseNetworkError"));
      return;
    }
    await clearLicenseKey();
    setError(result.message ?? t("licenseNotFound"));
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo className="mx-auto mb-4 h-24 w-24 rounded-3xl shadow-raised" />
          <h1 className="text-2xl font-bold text-foreground">{t("appName")}</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("appTagline")}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-lg font-bold text-card-foreground">{t("activationTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("activationSub")}</p>

          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleActivate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="license-key">{t("licenseKey")}</Label>
              <Input
                id="license-key"
                name="license_key"
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={(event) => setLicenseKey(event.target.value)}
                className="tabular h-12 text-center text-base tracking-[0.18em]"
              />
            </div>

            {error ? (
              <p className="flex items-start gap-2 rounded-xl bg-credit-soft px-3 py-2 text-sm font-medium text-credit">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" disabled={!canSubmit} className="h-12 w-full text-base">
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("activating")}
                </>
              ) : (
                t("activate")
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">{SUPPORT_LINE}</p>
      </div>
    </div>
  );
}

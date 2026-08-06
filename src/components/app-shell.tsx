import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Download, Loader2, WifiOff, X } from "lucide-react";

import { ActivationScreen } from "@/components/activation-screen";
import { LockedScreen } from "@/components/locked-screen";
import { TabBar } from "@/components/tab-bar";
import { initDb } from "@/lib/db";
import { LangContext, translate } from "@/lib/i18n";
import {
  checkAppVersion,
  checkLicense,
  clearLicenseKey,
  getLastStatus,
  getStoredLicenseKey,
  type UpdateInfo,
} from "@/lib/license";
import { useSettings } from "@/lib/use-store";

type Phase = "loading" | "activation" | "ready" | "locked";

const RECHECK_MS = 5 * 60 * 1000;

export function AppShell({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const [offline, setOffline] = useState(false);
  const settings = useSettings();
  const lang = settings.language;

  const verify = useCallback(async () => {
    const key = await getStoredLicenseKey();
    if (!key) {
      setPhase("activation");
      return;
    }
    const result = await checkLicense(key);
    if (result.status === "active") {
      setOffline(false);
      setPhase("ready");
      return;
    }
    if (result.status === "locked") {
      setOffline(false);
      setPhase("locked");
      return;
    }
    if (result.status === "offline") {
      // Offline must never block the shopkeeper: trust the last known status.
      setOffline(true);
      const last = await getLastStatus();
      setPhase(last === "locked" ? "locked" : "ready");
      return;
    }
    // not_found / unknown → wipe the key and go back to activation.
    await clearLicenseKey();
    setPhase("activation");
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await initDb();
      if (cancelled) return;
      await verify();
      void checkAppVersion().then((info) => {
        if (!cancelled && info.available) setUpdate(info);
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [verify]);

  // Re-check every 5 minutes while the app is open.
  useEffect(() => {
    const id = window.setInterval(() => void verify(), RECHECK_MS);
    return () => window.clearInterval(id);
  }, [verify]);

  // Re-check when the app comes back to the foreground.
  useEffect(() => {
    let remove: (() => void) | undefined;
    void (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) void verify();
        });
        remove = () => void handle.remove();
      } catch {
        /* web: no-op */
      }
    })();
    return () => remove?.();
  }, [verify]);

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (phase === "locked") {
    return (
      <LangContext.Provider value={lang}>
        <LockedScreen />
      </LangContext.Provider>
    );
  }

  if (phase === "activation") {
    return (
      <LangContext.Provider value={lang}>
        <ActivationScreen
          onActivated={() => setPhase("ready")}
          onLocked={() => setPhase("locked")}
        />
      </LangContext.Provider>
    );
  }

  return (
    <LangContext.Provider value={lang}>
      <div className="safe-top mx-auto min-h-screen max-w-lg pb-24">
        {update && !updateDismissed ? (
          <div className="flex items-center gap-2 bg-brass px-4 py-2 text-sm font-semibold text-brass-foreground">
            <span className="flex-1">
              {translate("updateAvailable", lang)}
              {update.latest ? ` · v${update.latest}` : ""}
            </span>
            {update.url ? (
              <a
                href={update.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-full bg-brass-foreground/12 px-2.5 py-1 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                {translate("download", lang)}
              </a>
            ) : null}
            <button
              type="button"
              aria-label="dismiss"
              onClick={() => setUpdateDismissed(true)}
              className="p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {offline ? (
          <p className="flex items-center gap-1.5 bg-muted px-4 py-1 text-[11px] font-semibold text-muted-foreground">
            <WifiOff className="h-3 w-3" />
            {translate("offline", lang)}
          </p>
        ) : null}

        {children}
      </div>
      <TabBar />
    </LangContext.Provider>
  );
}

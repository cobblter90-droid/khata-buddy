import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Loader2, WifiOff } from "lucide-react";

import { ActivationScreen } from "@/components/activation-screen";
import { AppLock } from "@/components/app-lock";
import { LockedScreen } from "@/components/locked-screen";
import { TabBar } from "@/components/tab-bar";
import { initDb } from "@/lib/db";
import { LangContext, translate } from "@/lib/i18n";
import {
  checkLicense,
  clearLicenseKey,
  getLastStatus,
  getStoredLicenseKey,
} from "@/lib/license";
import { useSettings } from "@/lib/use-store";

type Phase = "loading" | "activation" | "ready" | "locked";

const RECHECK_MS = 5 * 60 * 1000;

export function AppShell({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [offline, setOffline] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
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

  // Re-check when the app comes back to the foreground, and re-lock the PIN
  // gate as soon as it leaves it (Android usually resumes the same WebView
  // instead of cold-starting, so state alone never resets).
  useEffect(() => {
    let remove: (() => void) | undefined;
    void (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) void verify();
          else setUnlocked(false);
        });
        remove = () => void handle.remove();
      } catch {
        /* web: no-op */
      }
    })();
    return () => remove?.();
  }, [verify]);

  // Same for the browser/WebView lifecycle (covers back-button minimise).
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") setUnlocked(false);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);


  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // App lock: a PIN gate that only appears once the ledger is unlocked by license.
  if (phase === "ready" && settings.pinEnabled && settings.pin && !unlocked) {
    return (
      <LangContext.Provider value={lang}>
        <AppLock pin={settings.pin} onUnlock={() => setUnlocked(true)} />
      </LangContext.Provider>
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

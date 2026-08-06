import { useCallback, useMemo, useSyncExternalStore } from "react";

import * as db from "./db";
import type { Collection } from "./db";
import type { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  id: "app",
  createdAt: "",
  updatedAt: "",
  language: "ur",
  businessName: "",
  businessPhone: "",
  businessAddress: "",
  logo: null,
  pinEnabled: false,
  pin: null,
  invoiceCounter: 0,
};

function useDbVersion() {
  const subscribe = useCallback((cb: () => void) => db.subscribe(cb), []);
  return useSyncExternalStore(
    subscribe,
    () => db.getVersion(),
    () => 0,
  );
}

/** Live, non-deleted docs of a collection, newest first. */
export function useCollection<T extends db.BaseDoc>(collection: Collection): T[] {
  const version = useDbVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => db.list<T>(collection), [collection, version]);
}

export function useAllDocs<T extends db.BaseDoc>(collection: Collection): T[] {
  const version = useDbVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => db.listAll<T>(collection), [collection, version]);
}

export function useDoc<T extends db.BaseDoc>(collection: Collection, id: string | undefined) {
  const version = useDbVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => (id ? db.get<T>(collection, id) : undefined), [collection, id, version]);
}

export function useSettings(): Settings {
  const version = useDbVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    const stored = db.get<Settings>("settings", "app");
    return stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;
  }, [version]);
}

export async function saveSettings(patch: Partial<Settings>) {
  const current = db.get<Settings>("settings", "app") ?? DEFAULT_SETTINGS;
  const next: Settings = {
    ...DEFAULT_SETTINGS,
    ...current,
    ...patch,
    id: "app",
    createdAt: current.createdAt || db.nowIso(),
  };
  await db.put("settings", next);
  return next;
}

export async function nextInvoiceNo(): Promise<string> {
  const current = db.get<Settings>("settings", "app") ?? DEFAULT_SETTINGS;
  const counter = (current.invoiceCounter ?? 0) + 1;
  await saveSettings({ invoiceCounter: counter });
  return `INV-${String(counter).padStart(4, "0")}`;
}

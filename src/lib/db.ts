/**
 * Offline-first local database.
 *
 * Native (Android/iOS): @capacitor-community/sqlite, a real on-device SQLite file.
 * Web / Lovable preview: localStorage, so every screen is testable in the browser.
 *
 * Data is modelled as documents inside a single `docs` table
 * (collection, id, data JSON). That keeps one storage implementation for both
 * platforms, gives us soft-delete (recycle bin) for free, and is more than fast
 * enough for a single shop's ledger.
 *
 * Nothing here ever talks to a network. Only license/version checks do.
 */

export type Collection =
  | "settings"
  | "items"
  | "sales"
  | "customers"
  | "ledger"
  | "cashbook"
  | "reminders";

export const COLLECTIONS: Collection[] = [
  "settings",
  "items",
  "sales",
  "customers",
  "ledger",
  "cashbook",
  "reminders",
];

export type BaseDoc = {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** Soft delete — rows stay for the "Deleted items" recycle bin. */
  deletedAt?: string | null;
};

const DB_NAME = "assan_khata";
const WEB_KEY = "assan_khata_docs_v1";

type Table = Map<string, unknown>;
type Memory = Map<Collection, Table>;

const memory: Memory = new Map();
COLLECTIONS.forEach((c) => memory.set(c, new Map()));

let ready = false;
let readyPromise: Promise<void> | null = null;
let native = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sqlite: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let conn: any = null;

const listeners = new Set<() => void>();
let version = 0;

export function getVersion() {
  return version;
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  version += 1;
  listeners.forEach((fn) => fn());
}

function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = (window as any).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS docs (
  collection TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (collection, id)
);`;

export async function initDb(): Promise<void> {
  if (ready) return;
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    native = isNativePlatform();
    if (native) {
      try {
        const mod = await import("@capacitor-community/sqlite");
        sqlite = new mod.SQLiteConnection(mod.CapacitorSQLite);
        const exists = await sqlite.isConnection(DB_NAME, false);
        conn = exists.result
          ? await sqlite.retrieveConnection(DB_NAME, false)
          : await sqlite.createConnection(DB_NAME, false, "no-encryption", 1, false);
        await conn.open();
        await conn.execute(CREATE_SQL);
        const res = await conn.query("SELECT collection, id, data FROM docs;");
        for (const row of res.values ?? []) {
          const table = memory.get(row.collection as Collection);
          if (!table) continue;
          try {
            table.set(row.id as string, JSON.parse(row.data as string));
          } catch {
            /* skip corrupt row */
          }
        }
      } catch (err) {
        console.error("SQLite init failed, falling back to local storage", err);
        native = false;
        loadWeb();
      }
    } else {
      loadWeb();
    }
    ready = true;
    // Tell every subscriber (settings, lists) that stored data is now loaded.
    emit();
  })();

  return readyPromise;
}

function loadWeb() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(WEB_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, Record<string, unknown>>;
    for (const c of COLLECTIONS) {
      const table = memory.get(c)!;
      for (const [id, doc] of Object.entries(parsed[c] ?? {})) table.set(id, doc);
    }
  } catch (err) {
    console.error("Local store read failed", err);
  }
}

function saveWeb() {
  if (typeof window === "undefined") return;
  const out: Record<string, Record<string, unknown>> = {};
  for (const c of COLLECTIONS) out[c] = Object.fromEntries(memory.get(c)!.entries());
  try {
    window.localStorage.setItem(WEB_KEY, JSON.stringify(out));
  } catch (err) {
    console.error("Local store write failed", err);
  }
}

async function persist(collection: Collection, id: string, doc: unknown | null) {
  if (native && conn) {
    try {
      if (doc === null) {
        await conn.run("DELETE FROM docs WHERE collection = ? AND id = ?;", [collection, id]);
      } else {
        await conn.run(
          "INSERT OR REPLACE INTO docs (collection, id, data) VALUES (?, ?, ?);",
          [collection, id, JSON.stringify(doc)],
        );
      }
      return;
    } catch (err) {
      console.error("SQLite write failed", err);
    }
  }
  saveWeb();
}

export function nowIso() {
  return new Date().toISOString();
}

export function newId(prefix = "d") {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function listAll<T extends BaseDoc>(collection: Collection): T[] {
  return Array.from(memory.get(collection)!.values()) as T[];
}

/** Live (non-deleted) documents, newest first. */
export function list<T extends BaseDoc>(collection: Collection): T[] {
  return listAll<T>(collection)
    .filter((d) => !d.deletedAt)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function get<T extends BaseDoc>(collection: Collection, id: string): T | undefined {
  return memory.get(collection)!.get(id) as T | undefined;
}

export async function put<T extends BaseDoc>(collection: Collection, doc: T): Promise<T> {
  const next = { ...doc, updatedAt: nowIso() };
  memory.get(collection)!.set(next.id, next);
  await persist(collection, next.id, next);
  emit();
  return next;
}

export async function insert<T extends Omit<BaseDoc, "createdAt" | "updatedAt">>(
  collection: Collection,
  doc: T,
): Promise<T & BaseDoc> {
  const stamped = { ...doc, createdAt: nowIso(), updatedAt: nowIso() } as T & BaseDoc;
  memory.get(collection)!.set(stamped.id, stamped);
  await persist(collection, stamped.id, stamped);
  emit();
  return stamped;
}

/** Soft delete — recoverable from the recycle bin. */
export async function softDelete(collection: Collection, id: string) {
  const doc = get<BaseDoc>(collection, id);
  if (!doc) return;
  await put(collection, { ...doc, deletedAt: nowIso() });
}

export async function restore(collection: Collection, id: string) {
  const doc = get<BaseDoc>(collection, id);
  if (!doc) return;
  await put(collection, { ...doc, deletedAt: null });
}

/** Permanent delete — used by the recycle bin's "delete forever". */
export async function hardDelete(collection: Collection, id: string) {
  memory.get(collection)!.delete(id);
  await persist(collection, id, null);
  emit();
}

export async function wipeAll() {
  for (const c of COLLECTIONS) {
    const ids = Array.from(memory.get(c)!.keys());
    memory.get(c)!.clear();
    if (native && conn) {
      try {
        await conn.run("DELETE FROM docs WHERE collection = ?;", [c]);
      } catch (err) {
        console.error("SQLite wipe failed", err);
      }
    } else {
      void ids;
    }
  }
  saveWeb();
  emit();
}

export function exportSnapshot() {
  const out: Record<string, unknown[]> = {};
  for (const c of COLLECTIONS) out[c] = Array.from(memory.get(c)!.values());
  return { app: "assan-khata", version: 1, exportedAt: nowIso(), data: out };
}

export async function importSnapshot(snapshot: { data?: Record<string, BaseDoc[]> }) {
  const data = snapshot?.data ?? {};
  for (const c of COLLECTIONS) {
    for (const doc of data[c] ?? []) {
      if (!doc?.id) continue;
      memory.get(c)!.set(doc.id, doc);
      await persist(c, doc.id, doc);
    }
  }
  emit();
}

export function isReady() {
  return ready;
}

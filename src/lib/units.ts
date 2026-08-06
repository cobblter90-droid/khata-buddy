/**
 * Retail unit set for a general Pakistani shop.
 *
 * This is deliberately a broad, realistic list rather than a short hardcoded
 * one. `resolveUnit` never silently coerces an unknown unit — it flags it so
 * the UI can warn the shopkeeper while still saving what they typed.
 */

export type UnitDef = {
  id: string;
  ur: string;
  en: string;
  group: "count" | "weight" | "volume" | "length" | "pack" | "area" | "time";
};

export const UNITS: UnitDef[] = [
  // count
  { id: "piece", ur: "Piece", en: "Piece", group: "count" },
  { id: "dozen", ur: "Dozen", en: "Dozen", group: "count" },
  // weight
  { id: "kg", ur: "Kilo (Kg)", en: "Kilogram", group: "weight" },
  { id: "gram", ur: "Gram", en: "Gram", group: "weight" },
  { id: "pao", ur: "Pao (250g)", en: "Pao (250g)", group: "weight" },
  { id: "maund", ur: "Mann (40kg)", en: "Maund (40kg)", group: "weight" },
  // volume
  { id: "litre", ur: "Litre", en: "Litre", group: "volume" },
  { id: "ml", ur: "Milli Litre", en: "Millilitre", group: "volume" },
  // packaging
  { id: "packet", ur: "Packet", en: "Packet", group: "pack" },
  { id: "box", ur: "Dabba (Box)", en: "Box", group: "pack" },
  { id: "carton", ur: "Carton", en: "Carton", group: "pack" },
  { id: "bori", ur: "Bori (Sack)", en: "Sack (Bori)", group: "pack" },
  { id: "bottle", ur: "Bottle", en: "Bottle", group: "pack" },
  // length
  { id: "meter", ur: "Meter", en: "Metre", group: "length" },
  { id: "foot", ur: "Foot", en: "Foot", group: "length" },
];

const BY_ID = new Map(UNITS.map((u) => [u.id, u]));
const BY_LABEL = new Map<string, UnitDef>();
for (const u of UNITS) {
  BY_LABEL.set(u.ur.toLowerCase(), u);
  BY_LABEL.set(u.en.toLowerCase(), u);
  BY_LABEL.set(u.id.toLowerCase(), u);
}

export function findUnit(value: string | null | undefined): UnitDef | undefined {
  if (!value) return undefined;
  return BY_ID.get(value) ?? BY_LABEL.get(value.trim().toLowerCase());
}

export function isKnownUnit(value: string | null | undefined): boolean {
  return Boolean(findUnit(value));
}

export function unitLabel(value: string | null | undefined, lang: "ur" | "en"): string {
  const unit = findUnit(value);
  if (!unit) return (value ?? "").trim() || "—";
  return lang === "ur" ? unit.ur : unit.en;
}

export const UNIT_GROUP_LABEL: Record<UnitDef["group"], { ur: string; en: string }> = {
  count: { ur: "Ginti", en: "Count" },
  weight: { ur: "Wazan", en: "Weight" },
  volume: { ur: "Maaya (Volume)", en: "Volume" },
  length: { ur: "Lambai", en: "Length" },
  area: { ur: "Raqba", en: "Area" },
  pack: { ur: "Packing", en: "Packing" },
  time: { ur: "Waqt / Service", en: "Time / Service" },
};

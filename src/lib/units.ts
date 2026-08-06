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
  { id: "pair", ur: "Jorra (Pair)", en: "Pair", group: "count" },
  { id: "set", ur: "Set", en: "Set", group: "count" },
  { id: "gross", ur: "Gross", en: "Gross (144)", group: "count" },
  { id: "score", ur: "Kori (20)", en: "Score (20)", group: "count" },
  // weight
  { id: "kg", ur: "Kilo (Kg)", en: "Kilogram", group: "weight" },
  { id: "gram", ur: "Gram", en: "Gram", group: "weight" },
  { id: "tola", ur: "Tola", en: "Tola", group: "weight" },
  { id: "pao", ur: "Pao (250g)", en: "Pao (250g)", group: "weight" },
  { id: "adhkilo", ur: "Aadha Kilo", en: "Half Kilo", group: "weight" },
  { id: "maund", ur: "Mann (40kg)", en: "Maund (40kg)", group: "weight" },
  { id: "quintal", ur: "Quintal", en: "Quintal", group: "weight" },
  { id: "ton", ur: "Ton", en: "Ton", group: "weight" },
  { id: "seer", ur: "Ser", en: "Seer", group: "weight" },
  { id: "pound", ur: "Pound (lb)", en: "Pound", group: "weight" },
  { id: "ounce", ur: "Ounce", en: "Ounce", group: "weight" },
  // volume
  { id: "litre", ur: "Litre", en: "Litre", group: "volume" },
  { id: "ml", ur: "Milli Litre", en: "Millilitre", group: "volume" },
  { id: "gallon", ur: "Gallon", en: "Gallon", group: "volume" },
  { id: "drum", ur: "Drum", en: "Drum", group: "volume" },
  { id: "canister", ur: "Kaneez / Canister", en: "Canister", group: "volume" },
  // packaging
  { id: "packet", ur: "Packet", en: "Packet", group: "pack" },
  { id: "box", ur: "Dabba (Box)", en: "Box", group: "pack" },
  { id: "carton", ur: "Carton", en: "Carton", group: "pack" },
  { id: "bori", ur: "Bori (Sack)", en: "Sack (Bori)", group: "pack" },
  { id: "bag", ur: "Bag", en: "Bag", group: "pack" },
  { id: "bottle", ur: "Bottle", en: "Bottle", group: "pack" },
  { id: "can", ur: "Can / Tin", en: "Can / Tin", group: "pack" },
  { id: "jar", ur: "Jar", en: "Jar", group: "pack" },
  { id: "tin", ur: "Tin", en: "Tin", group: "pack" },
  { id: "roll", ur: "Roll", en: "Roll", group: "pack" },
  { id: "bundle", ur: "Gattha (Bundle)", en: "Bundle", group: "pack" },
  { id: "crate", ur: "Crate / Khokha", en: "Crate", group: "pack" },
  { id: "tray", ur: "Tray", en: "Tray", group: "pack" },
  { id: "strip", ur: "Strip / Patti", en: "Strip", group: "pack" },
  { id: "sachet", ur: "Sachet", en: "Sachet", group: "pack" },
  { id: "pouch", ur: "Pouch", en: "Pouch", group: "pack" },
  { id: "roll_thaan", ur: "Thaan", en: "Roll (Thaan)", group: "pack" },
  // length / area
  { id: "meter", ur: "Meter", en: "Metre", group: "length" },
  { id: "cm", ur: "Centi Meter", en: "Centimetre", group: "length" },
  { id: "foot", ur: "Foot", en: "Foot", group: "length" },
  { id: "inch", ur: "Inch", en: "Inch", group: "length" },
  { id: "yard", ur: "Gaz (Yard)", en: "Yard", group: "length" },
  { id: "sqft", ur: "Square Foot", en: "Square Foot", group: "area" },
  { id: "sqm", ur: "Square Meter", en: "Square Metre", group: "area" },
  { id: "marla", ur: "Marla", en: "Marla", group: "area" },
  // service / time
  { id: "hour", ur: "Ghanta (Hour)", en: "Hour", group: "time" },
  { id: "day", ur: "Din (Day)", en: "Day", group: "time" },
  { id: "month", ur: "Maheena", en: "Month", group: "time" },
  { id: "service", ur: "Service", en: "Service", group: "time" },
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

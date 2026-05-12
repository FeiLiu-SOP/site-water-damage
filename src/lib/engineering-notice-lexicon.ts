/**
 * Geotechnical / climate / envelope micro-clauses for per-page Engineering Notice (SSR-stable).
 * 10 × 10 = 100 strings; `pickTwoEngineeringNoticeClauses` returns two distinct picks.
 */

/** 10 × 10 = 100 lexicon strings. */
const PREFIX = [
  "High humidity causes",
  "Coastal salt air affects",
  "Midland freeze-thaw cycles stress",
  "Clay-rich subsoils amplify",
  "Seasonal wet-dry swings fatigue",
  "Low-slope drainage patterns concentrate",
  "Wind-driven rain loading tests",
  "Thermal bridging at transitions can worsen",
  "Wildland-urban interface heat spikes accelerate",
  "Karst-adjacent groundwater variability influences",
] as const;

const SUFFIX = [
  "expansion and fastener seating in roof-to-wall joints.",
  "sealant pliability and lap-shear performance at transitions.",
  "joint movement in parapet and coping assemblies.",
  "capillary rise risk near stem walls and sill plates.",
  "adhesive bonds on self-adhered membranes during shoulder seasons.",
  "shingle seal-down timing after temperature swings.",
  "metal panel clip galling if expansion runs are undersized.",
  "underlayment wrinkling when deck moisture is uneven.",
  "ice-dam backup paths at eaves and penetrations.",
  "ridge vent neutral pressure assumptions during wind events.",
] as const;

export const ENGINEERING_NOTICE_LEXICON: readonly string[] = PREFIX.flatMap((p) =>
  SUFFIX.map((s) => `${p} ${s}`.replace(/\s+/g, " ").trim()),
);

function stableHash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickTwoEngineeringNoticeClauses(seedSlug: string, collectionKey: string): readonly [string, string] {
  const lex = ENGINEERING_NOTICE_LEXICON;
  const n = lex.length;
  let i1 = stableHash(`${collectionKey}|${seedSlug}|eng1`) % n;
  let i2 = stableHash(`${collectionKey}|${seedSlug}|eng2`) % n;
  if (i2 === i1) {
    i2 = (i2 + 1 + (stableHash(`${seedSlug}|engb`) % (n - 1 || 1))) % n;
  }
  return [lex[i1]!, lex[i2]!] as const;
}

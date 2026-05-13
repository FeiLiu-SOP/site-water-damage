/**
 * 与 `scripts/forbidden-phrases.ci.generated.json` 中各商业 `targets[].forbidden_phrases` 对齐，
 * 用于在 SSR 文案池（CAS / meta-analysis）阶段剔除会触发 `semantic-scan.py` 的跨垂直子串。
 * 若 audit 调整了禁词表，请同步更新本文件（或改为由 audit 生成此模块）。
 */
import type { ActiveCollectionKey } from "../active-collection-keys";

/** 与 `semantic_scan_lib.phrase_matches_in_lower_html` 一致：含空格用子串；否则用 [a-z0-9] 词边界，避免 Apex→PEX、residing→siding 误杀。 */
function forbiddenPhraseMatchesLowerText(lower: string, phrase: string): boolean {
  const needle = phrase.trim().toLowerCase();
  if (!needle) return false;
  if (/\s/.test(needle)) return lower.includes(needle);
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`).test(lower);
}

const COMMERCIAL_FORBIDDEN: Partial<Record<ActiveCollectionKey, readonly string[]>> = {
  roofing: [
    "structural drying",
    "dehumidifier chamber",
    "bed bug",
    "termite",
    "hydro-jetting",
    "slab leak listening",
    "sump discharge head",
    "plumber",
    "PEX",
    "drain line",
    "water heater",
    "termite trail",
    "rodent gnaw",
    "perimeter exclusion",
    "psychrometric",
    "moisture mapping",
    "siding",
    "J-channel",
    "housewrap",
    "fiber-cement",
    "kickout flash",
    "repiping",
    "cleanout",
    "backflow",
  ],
  plumbing: [
    "structural drying",
    "bed bug",
    "termite trail",
    "shingle seal-down",
    "ice-dam backup",
    "rodent gnaw paths",
    "roofing",
    "ice dam",
    "ridge vent",
    "roof deck",
    "rodent gnaw",
    "perimeter exclusion",
    "psychrometric",
    "moisture mapping",
    "dehumidifier chamber",
    "siding",
    "J-channel",
    "housewrap",
    "fiber-cement",
    "kickout flash",
    "repiping",
    "cleanout",
    "backflow",
    "drain line",
  ],
  pestcontrol: [
    "structural drying",
    "pipe corrosion",
    "leak detection",
    "shingle replacement",
    "hydro-jetting envelope",
    "dehumidifier reheat",
    "roofing",
    "shingle seal-down",
    "ice dam",
    "ridge vent",
    "roof deck",
    "plumber",
    "PEX",
    "hydro-jetting",
    "drain line",
    "water heater",
    "psychrometric",
    "moisture mapping",
    "dehumidifier chamber",
    "siding",
    "J-channel",
    "housewrap",
    "fiber-cement",
    "kickout flash",
    "repiping",
    "cleanout",
    "backflow",
  ],
  "water-damage": [
    "bed bug aggregation",
    "termite shelter tubes",
    "shingle seal-down timing",
    "hydro-jetter nozzle envelope",
    "roofing",
    "shingle seal-down",
    "ice dam",
    "ridge vent",
    "roof deck",
    "plumber",
    "PEX",
    "hydro-jetting",
    "drain line",
    "water heater",
    "bed bug",
    "termite trail",
    "rodent gnaw",
    "perimeter exclusion",
    "siding",
    "J-channel",
    "housewrap",
    "fiber-cement",
    "kickout flash",
    "repiping",
    "cleanout",
    "backflow",
  ],
  "siding-services": [
    "slab leak listening window",
    "camera pass friction on offset closet bends",
    "bed bug",
    "structural drying chamber",
    "roofing",
    "shingle seal-down",
    "ice dam",
    "ridge vent",
    "roof deck",
    "plumber",
    "PEX",
    "hydro-jetting",
    "drain line",
    "water heater",
    "termite trail",
    "rodent gnaw",
    "perimeter exclusion",
    "structural drying",
    "psychrometric",
    "moisture mapping",
    "dehumidifier chamber",
    "repiping",
    "cleanout",
    "backflow",
  ],
  "plumbing-v2": [
    "termite shelter tubes",
    "rodent gnaw paths",
    "structural drying",
    "psychrometric ramp",
    "roofing",
    "shingle seal-down",
    "ice dam",
    "ridge vent",
    "roof deck",
    "plumber",
    "PEX",
    "hydro-jetting",
    "drain line",
    "water heater",
    "bed bug",
    "termite trail",
    "rodent gnaw",
    "perimeter exclusion",
    "psychrometric",
    "moisture mapping",
    "dehumidifier chamber",
    "siding",
    "J-channel",
    "housewrap",
    "fiber-cement",
    "kickout flash",
  ],
};

/** 禁词表（与 semantic-scan 一致：多词为子串；单词为 [a-z0-9] 边界）。教堂赛道不在此表。 */
export function forbiddenSubstringsForCommercialScan(collectionKey: string): readonly string[] {
  if (collectionKey.startsWith("community-stewardship-")) return [];
  const row = COMMERCIAL_FORBIDDEN[collectionKey as ActiveCollectionKey];
  return row ?? [];
}

export function filterTextPoolForCommercialHtml<T extends string>(collectionKey: string, pool: readonly T[]): T[] {
  const needles = forbiddenSubstringsForCommercialScan(collectionKey);
  if (!needles.length) return [...pool];
  return pool.filter((line) => {
    const low = line.toLowerCase();
    return !needles.some((n) => {
      const t = n.trim();
      return t && forbiddenPhraseMatchesLowerText(low, t);
    });
  });
}

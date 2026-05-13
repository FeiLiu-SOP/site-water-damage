/**
 * 从 `scripts/niche-master.json` 加载赛道单一真相源（Engineering Notice、禁词、关键词、别名池等）。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ACTIVE_COLLECTION_KEYS, type ActiveCollectionKey } from "../active-collection-keys";

/** Astro 打包后 import.meta.url 落在 dist chunk 内，须用 cwd / 多候选解析 SSOT 路径 */
function resolveNicheMasterJson(): string {
  const candidates = [
    path.join(process.cwd(), "scripts", "niche-master.json"),
    path.join(process.cwd(), "absent-apogee", "scripts", "niche-master.json"),
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "scripts", "niche-master.json"),
  ];
  for (const p of candidates) {
    const norm = path.normalize(p);
    if (fs.existsSync(norm)) return norm;
  }
  throw new Error(`[niche-master-data] niche-master.json not found. Tried:\n${candidates.join("\n")}`);
}

export type EngineeringNoticeBlock =
  | { mode: "prefixSuffix"; prefixes: string[]; suffixes: string[] }
  | { mode: "fullLines"; lines: string[] };

export type NicheCollectionRecord = {
  titleSuffix: string;
  dispatchPhone: string;
  nicheKeywords: string[];
  forbiddenPhrases: string[];
  /** 商业子仓 dist（参与 cross-niche commercial semantic-scan）；教堂赛道禁止与此并存 */
  ciDistHtmlRoot?: string;
  /** 教堂 / NPO 合规扫描产物根（仅 ciAuditProfile=church） */
  ciChurchDistRoot?: string;
  /** commercial = 默认；church = 不走商业禁词 dist 扫描，走 compliance-audit-church */
  ciAuditProfile?: "commercial" | "church";
  aliasPoolOrdered?: string[];
  engineeringNotice: EngineeringNoticeBlock;
};

export type NicheMasterDocument = {
  schemaVersion: number;
  document?: string;
  collections: Record<string, NicheCollectionRecord>;
  goNicheSpecs: Record<string, unknown>;
};

function loadMaster(): NicheMasterDocument {
  const jsonPath = resolveNicheMasterJson();
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as NicheMasterDocument;
  if (!raw.collections || typeof raw.collections !== "object") {
    throw new Error("[niche-master-data] niche-master.json: missing collections");
  }
  if (!raw.goNicheSpecs || typeof raw.goNicheSpecs !== "object") {
    throw new Error("[niche-master-data] niche-master.json: missing goNicheSpecs");
  }
  for (const key of ACTIVE_COLLECTION_KEYS) {
    if (!raw.collections[key]) {
      throw new Error(`[niche-master-data] niche-master.json missing collection "${key}"`);
    }
  }
  for (const k of Object.keys(raw.collections)) {
    if (!ACTIVE_COLLECTION_KEYS.includes(k as ActiveCollectionKey)) {
      throw new Error(`[niche-master-data] niche-master.json unknown collection "${k}"`);
    }
  }
  for (const key of ACTIVE_COLLECTION_KEYS) {
    if (!raw.goNicheSpecs[key]) {
      throw new Error(`[niche-master-data] niche-master.json missing goNicheSpecs["${key}"]`);
    }
  }
  for (const key of ACTIVE_COLLECTION_KEYS) {
    const c = raw.collections[key]!;
    if (!c.titleSuffix?.trim()) throw new Error(`[niche-master-data] empty titleSuffix: ${key}`);
    if (!c.dispatchPhone?.trim()) throw new Error(`[niche-master-data] empty dispatchPhone: ${key}`);
    if (!c.nicheKeywords?.length) throw new Error(`[niche-master-data] empty nicheKeywords: ${key}`);
    if (!c.forbiddenPhrases?.length) throw new Error(`[niche-master-data] empty forbiddenPhrases: ${key}`);
    if (!c.engineeringNotice) throw new Error(`[niche-master-data] missing engineeringNotice: ${key}`);
  }
  for (const key of ACTIVE_COLLECTION_KEYS) {
    const c = raw.collections[key]!;
    const profile = c.ciAuditProfile ?? "commercial";
    if (profile === "church") {
      if (c.ciDistHtmlRoot?.trim()) {
        throw new Error(
          `[niche-master-data] ${key}: ciAuditProfile=church must not set ciDistHtmlRoot (commercial scan isolation)`,
        );
      }
      if (!c.ciChurchDistRoot?.trim()) {
        throw new Error(`[niche-master-data] ${key}: ciAuditProfile=church requires ciChurchDistRoot`);
      }
    } else {
      if (c.ciChurchDistRoot?.trim()) {
        throw new Error(`[niche-master-data] ${key}: ciChurchDistRoot only allowed when ciAuditProfile=church`);
      }
    }
  }
  return raw;
}

const NICHE_MASTER: NicheMasterDocument = loadMaster();

const engineeringLexiconCache = new Map<ActiveCollectionKey, readonly string[]>();

function expandEngineeringNotice(notice: EngineeringNoticeBlock): readonly string[] {
  if (notice.mode === "fullLines") {
    return notice.lines.map((s) => s.replace(/\s+/g, " ").trim());
  }
  return notice.prefixes.flatMap((p) =>
    notice.suffixes.map((s) => `${p} ${s}`.replace(/\s+/g, " ").trim()),
  );
}

export function getNicheMaster(): Readonly<NicheMasterDocument> {
  return NICHE_MASTER;
}

export function getNicheCollection(key: ActiveCollectionKey): Readonly<NicheCollectionRecord> {
  const row = NICHE_MASTER.collections[key];
  if (!row) throw new Error(`[niche-master-data] missing collection ${key}`);
  return row;
}

export function getEngineeringLexicon(collectionKey: ActiveCollectionKey): readonly string[] {
  let cached = engineeringLexiconCache.get(collectionKey);
  if (!cached) {
    const row = getNicheCollection(collectionKey);
    const lex = expandEngineeringNotice(row.engineeringNotice);
    if (!lex.length) {
      throw new Error(`[niche-master-data] empty engineeringNotice for ${collectionKey}`);
    }
    cached = Object.freeze(lex);
    engineeringLexiconCache.set(collectionKey, cached);
  }
  return cached;
}

/** Realtors / hub 变体标题池；顺序须与 Go `stableHashUint32` 取模一致。 */
export function getAliasPoolOrdered(collectionKey: ActiveCollectionKey): readonly string[] | undefined {
  const pool = getNicheCollection(collectionKey).aliasPoolOrdered;
  if (!pool?.length) return undefined;
  return pool;
}

export const NICHE_DIST_ROOT_RELATIVE: Partial<Record<ActiveCollectionKey, string>> = ACTIVE_COLLECTION_KEYS.reduce(
  (acc, key) => {
    const rel = getNicheCollection(key).ciDistHtmlRoot?.trim();
    if (rel) acc[key] = rel;
    return acc;
  },
  {} as Partial<Record<ActiveCollectionKey, string>>,
);

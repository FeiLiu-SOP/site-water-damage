/**
 * 赛道封闭词库：SSR Engineering Notice 辅句必须来自当前 collection，禁止跨垂直 fallback。
 * 词库正文来自 `scripts/niche-master.json`（经 `niche-master-data` 展开 prefix/suffix）。
 */
import type { ActiveCollectionKey } from "../active-collection-keys";
import { getEngineeringLexicon } from "./niche-master-data";

function stableHash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickTwoEngineeringNoticeClauses(seedSlug: string, collectionKey: string): readonly [string, string] {
  const k = collectionKey as ActiveCollectionKey;
  const lex = getEngineeringLexicon(k);
  if (!lex || lex.length === 0) {
    throw new Error(
      `[engineering-notice-lexicon] No closed lexicon for collection "${collectionKey}" — cross-niche fallback forbidden`,
    );
  }
  const n = lex.length;
  let i1 = stableHash(`${collectionKey}|${seedSlug}|eng1`) % n;
  let i2 = stableHash(`${collectionKey}|${seedSlug}|eng2`) % n;
  if (i2 === i1) {
    i2 = (i2 + 1 + (stableHash(`${seedSlug}|engb`) % (n - 1 || 1))) % n;
  }
  return [lex[i1]!, lex[i2]!] as const;
}

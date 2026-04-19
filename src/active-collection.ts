/**
 * 方案 B：构建时只编译一个 niche 目录。与 `content.config.ts` 里的 collection 名一致。
 * 未设置时默认为 `roofing`，与迁移前行为一致。
 * 新增领域：在 ALLOWED、content.config.ts、Go `nicheRegistry` 等处同步扩展；完整清单见仓库根目录
 * `docs/CONTENT_PIPELINE.md` 第四节 Checklist。
 */
const ALLOWED = [
  "roofing",
  "plumbing",
  "pestcontrol",
  "water-damage",
  "siding-services",
  "plumbing-v2",
] as const;

export type ActiveCollectionKey = (typeof ALLOWED)[number];

function readRaw(): string {
  const fromProcess =
    typeof process !== "undefined" && process.env.ACTIVE_COLLECTION
      ? process.env.ACTIVE_COLLECTION.trim()
      : "";
  if (fromProcess) return fromProcess.toLowerCase();

  const fromMeta = import.meta.env.ACTIVE_COLLECTION;
  if (typeof fromMeta === "string" && fromMeta.trim()) {
    return fromMeta.trim().toLowerCase();
  }

  return "water-damage";
}

const normalized = readRaw();

function isAllowed(k: string): k is ActiveCollectionKey {
  return (ALLOWED as readonly string[]).includes(k);
}

if (!isAllowed(normalized)) {
  throw new Error(
    `[active-collection] Invalid ACTIVE_COLLECTION="${normalized}". Allowed: ${ALLOWED.join(", ")}`,
  );
}

/** 当前构建使用的 content collection 名（与 `src/content/<name>/` 目录名一致） */
export const ACTIVE_COLLECTION: ActiveCollectionKey = normalized;

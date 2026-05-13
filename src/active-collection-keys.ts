/**
 * 纯数据：无 `import.meta` / 进程外副作用。Node/tsx 审计脚本可安全导入。
 * 与 `content.config.ts` / Go `nicheRegistry` / `active-collection.ts` 须保持一致。
 */
export const ACTIVE_COLLECTION_KEYS = [
  "roofing",
  "plumbing",
  "pestcontrol",
  "water-damage",
  "siding-services",
  "plumbing-v2",
  "community-stewardship-water",
  "community-stewardship-siding",
  "community-stewardship-plumbing",
] as const;

export type ActiveCollectionKey = (typeof ACTIVE_COLLECTION_KEYS)[number];

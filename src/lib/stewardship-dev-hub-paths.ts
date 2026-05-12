/**
 * Dev-only：在单进程 `astro dev` 下合并注册三个 community-stewardship 集合的静态路径。
 * 必须放在独立 .ts 中：`getStaticPaths` 在 Vite/Astro 下会被拆到独立 chunk，同页内联函数不在其作用域内。
 */
import { ACTIVE_COLLECTION, type ActiveCollectionKey } from "../active-collection";

export const STEWARDSHIP_HUB_KEYS: readonly ActiveCollectionKey[] = [
  "community-stewardship-water",
  "community-stewardship-siding",
  "community-stewardship-plumbing",
];

export function stewardshipDevHubMergeEnabled(): boolean {
  const hub = (process.env.DEV_COMMUNITY_STEWARDSHIP_HUB ?? "").trim() === "1";
  if (!hub || !import.meta.env.DEV) return false;
  return (STEWARDSHIP_HUB_KEYS as readonly string[]).includes(ACTIVE_COLLECTION);
}

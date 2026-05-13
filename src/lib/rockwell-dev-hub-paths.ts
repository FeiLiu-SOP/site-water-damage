/**
 * Dev-only：单进程 `astro dev` 下合并注册 Rockwell 三垂直（roofing / plumbing / pestcontrol）静态路径。
 * 避免并行 `ACTIVE_COLLECTION` 多开争写 `.astro/`（EPERM）。
 * 逻辑须独立成文件：`getStaticPaths` 在 Vite/Astro 下会被拆块。
 */
import { ACTIVE_COLLECTION, type ActiveCollectionKey } from "../active-collection";

export const ROCKWELL_HUB_KEYS: readonly ActiveCollectionKey[] = ["roofing", "plumbing", "pestcontrol"];

export function rockwellDevHubMergeEnabled(): boolean {
  const hub = (process.env.DEV_ROCKWELL_HUB ?? "").trim() === "1";
  if (!hub || !import.meta.env.DEV) return false;
  return (ROCKWELL_HUB_KEYS as readonly string[]).includes(ACTIVE_COLLECTION);
}

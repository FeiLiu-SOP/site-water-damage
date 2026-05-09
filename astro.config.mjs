// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { loadEnv } from "vite";
import { remarkStripRoutingMarkers } from "./src/remark-strip-routing-markers.mjs";
import { resolvePublicSiteUrl } from "./resolve-public-site-url.mjs";
import {
  SEGMENT_BY_COLLECTION,
  augmentHubPathForMainSite,
  toAstroSiteAndBase,
} from "./hub-site-path.mjs";

const fallbackSite = "https://la-roofing-v1.pages.dev";

// 必须用「对象形式」导出 config，保证 `site` 在集成阶段已存在；
// 若用 defineConfig(({ mode }) => …) 回调，在 Astro 6 下 @astrojs/sitemap 可能读不到 site，导致不生成 *.xml，
// Cloudflare 再把不存在的 /sitemap-index.xml 回退成首页 HTML。
const mode = process.env.NODE_ENV === "production" ? "production" : "development";
const fileEnv = loadEnv(mode, process.cwd(), "");
const activeCollection =
  process.env.ACTIVE_COLLECTION ?? fileEnv.ACTIVE_COLLECTION ?? "roofing";
const disableAugment =
  process.env.PUBLIC_AUTO_SITEMAP_PATH ?? fileEnv.PUBLIC_AUTO_SITEMAP_PATH;
const fullSiteUrl = augmentHubPathForMainSite(
  resolvePublicSiteUrl({
    site: process.env.PUBLIC_SITE_URL ?? fileEnv.PUBLIC_SITE_URL,
    canonical: process.env.PUBLIC_CANONICAL_ORIGIN ?? fileEnv.PUBLIC_CANONICAL_ORIGIN,
    fallback: fallbackSite,
  }),
  activeCollection,
  disableAugment
);
const { site, base } = toAstroSiteAndBase(fullSiteUrl, activeCollection);
const normalizedCollection = String(activeCollection).toLowerCase().trim();
let enforcedBase = normalizedCollection === "plumbing-v2" ? "/plumbing/" : base;
/** Local/dev often resolves `site` to *.pages.dev → `base` "/" (`hub-site-path`). Hub URLs then break (e.g. /water-damage/ 404). Align with production segment. */
const hubSeg = SEGMENT_BY_COLLECTION[normalizedCollection];
if (hubSeg && enforcedBase === "/") {
  enforcedBase = normalizedCollection === "plumbing-v2" ? "/plumbing/" : `/${hubSeg}/`;
}

// https://astro.build/config
export default defineConfig({
  site,
  base: enforcedBase,
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkStripRoutingMarkers],
  },
});

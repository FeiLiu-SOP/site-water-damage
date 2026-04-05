// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { loadEnv } from "vite";

const fallbackSite = "https://la-roofing-v1.pages.dev";

// https://astro.build/config
// sitemap 绝对链接依赖 site；与 src/site-config.ts 同源：优先 CI/process.env，其次本地 .env（loadEnv）
export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), "");
  const site =
    process.env.PUBLIC_SITE_URL ??
    fileEnv.PUBLIC_SITE_URL ??
    fallbackSite;

  return {
    site,
    integrations: [sitemap()],
  };
});

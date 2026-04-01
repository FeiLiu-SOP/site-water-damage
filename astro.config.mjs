// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
// sitemap 里的绝对链接依赖 site；上线前改成你的真实域名（或 Cloudflare Pages 分配的 *.pages.dev）
export default defineConfig({
  site: "https://example.com",
  integrations: [sitemap()],
});

/**
 * Post-build: Astro prerenders to dist/<route>/ while hrefs use config.base (e.g. /roofing/).
 * Move everything into dist/<segment>/ so Cloudflare Pages paths match.
 *
 * Usage: node ./scripts/nest-hub-segment.mjs <segment>
 * Env: SKIP_NEST_HUB_OUTPUT=1 to skip; NEST_HUB_SEGMENT if argv omitted.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

const KEEP_AT_DIST_ROOT = new Set(["_redirects", "_headers", "_routes.json"]);

function main() {
  const segment = process.argv[2] || process.env.NEST_HUB_SEGMENT;
  if (!segment || !/^[a-z0-9-]+$/.test(segment)) {
    console.error("[nest-hub-segment] usage: node nest-hub-segment.mjs <segment>");
    process.exit(1);
  }
  if (process.env.SKIP_NEST_HUB_OUTPUT === "1") {
    console.log("[nest-hub-segment] SKIP_NEST_HUB_OUTPUT=1, skip");
    return;
  }
  if (!fs.existsSync(dist)) {
    console.error("[nest-hub-segment] missing dist/");
    process.exit(1);
  }
  const nestDir = path.join(dist, segment);
  const flatStateDir = path.join(dist, "ak");
  const nestedIndex = path.join(nestDir, "index.html");
  if (fs.existsSync(nestedIndex) && !fs.existsSync(flatStateDir)) {
    console.log("[nest-hub-segment] already nested, skip");
    return;
  }
  if (!fs.existsSync(flatStateDir)) {
    console.log("[nest-hub-segment] no flat state dir (ak/), skip");
    return;
  }

  fs.mkdirSync(nestDir, { recursive: true });
  for (const name of fs.readdirSync(dist)) {
    if (name === segment) continue;
    if (KEEP_AT_DIST_ROOT.has(name)) continue;
    fs.renameSync(path.join(dist, name), path.join(nestDir, name));
  }
  console.log(`[nest-hub-segment] moved build output into dist/${segment}/`);
}

main();

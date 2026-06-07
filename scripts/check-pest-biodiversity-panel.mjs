#!/usr/bin/env node
/**
 * Pest biodiversity panel — source + dist gate.
 *
 *   node scripts/check-pest-biodiversity-panel.mjs --source   # SSOT wiring (fast, no build)
 *   node scripts/check-pest-biodiversity-panel.mjs              # dist HTML (after build:pestcontrol)
 *
 * Env: BUILD_ASSERT_DIST (default ./dist)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CORPUS = path.join(ROOT, "src", "lib", "pest-biodiversity-corpus.json");
const SLUG_PAGE = path.join(ROOT, "src", "pages", "[...slug].astro");
const PANEL = path.join(ROOT, "src", "components", "PestBiodiversityPanel.astro");
const FLASH = path.join(ROOT, "src", "components", "FlashCouponAnchor.astro");
const LIB = path.join(ROOT, "src", "lib", "pest-biodiversity.ts");
const FLASH_LIB = path.join(ROOT, "src", "lib", "flash-coupon.ts");
const MIN_PESTS = 30;
const FEATURED = 6;

function fail(msg) {
  console.error(`[check-pest-biodiversity] FAIL: ${msg}`);
  process.exit(1);
}

function isPestCityDetailRel(rel) {
  const r = rel.replace(/\\/g, "/");
  if (/community-stewardship/i.test(r)) return false;
  if (/near-me\//i.test(r) && !/-\d{5}\//.test(r)) return false;
  if (/pest-control-[^/]+\/index\.html$/i.test(r)) return true;
  if (/-pest-exterminator-[^/]+\/index\.html$/i.test(r)) return true;
  if (/\/pestcontrol\/[^/]+\/index\.html$/i.test(r)) {
    if (/\/pestcontrol\/index\.html$/i.test(r)) return false;
    return /-\d{5}\/index\.html$/i.test(r) || /pest-control-/.test(r) || /-pest-exterminator-/.test(r);
  }
  if (/^pestcontrol\/[^/]+\/index\.html$/i.test(r)) {
    return /-\d{5}\/index\.html$/i.test(r) || /pest-control-/.test(r) || /-pest-exterminator-/.test(r);
  }
  return false;
}

function checkSource() {
  for (const p of [CORPUS, SLUG_PAGE, PANEL, FLASH, LIB, FLASH_LIB]) {
    if (!fs.existsSync(p)) fail(`missing ${path.relative(ROOT, p)}`);
  }
  const slugSrc = fs.readFileSync(SLUG_PAGE, "utf8");
  const required = [
    "PestBiodiversityPanel",
    "FlashCouponAnchor",
    "showFlashCoupon",
    "buildPestBiodiversityBundle",
    "isPestControlHub",
    "pestBiodiversityBundle",
  ];
  for (const token of required) {
    if (!slugSrc.includes(token)) fail(`[...slug].astro missing ${token}`);
  }
  if (!slugSrc.includes("showFlashCoupon") || !slugSrc.includes("FlashCouponAnchor")) {
    fail("[...slug].astro must render FlashCouponAnchor via showFlashCoupon (fleet-wide)");
  }
  if (!/isPestControlHub\s*\?[\s\S]*PestBiodiversityPanel/.test(slugSrc)) {
    fail("[...slug].astro must render PestBiodiversityPanel only in pestcontrol branch");
  }
  const corpus = JSON.parse(fs.readFileSync(CORPUS, "utf8"));
  const pests = corpus.pests ?? [];
  if (pests.length < MIN_PESTS) {
    fail(`corpus has ${pests.length} pests, need >= ${MIN_PESTS}`);
  }
  for (const p of pests) {
    if (!p.id || !p.name || !p.svgPaths || !p.descriptionSpintax) {
      fail(`corpus entry incomplete: ${p.id ?? "(no id)"}`);
    }
    if (!p.climatePool) {
      fail(`corpus ${p.id} missing climatePool`);
    }
    if (p.iconPath) {
      fail(`corpus ${p.id} still uses iconPath — use inline svgPaths only`);
    }
  }
  const libSrc = fs.readFileSync(LIB, "utf8");
  if (!libSrc.includes("bleachedPestIconAccent")) {
    fail("pest-biodiversity.ts missing icon fingerprint bleach (bleachedPestIconAccent)");
  }
  const flashLibSrc = fs.readFileSync(FLASH_LIB, "utf8");
  if (!/\[45,\s*50,\s*55,\s*60\]/.test(flashLibSrc)) {
    fail("flash-coupon.ts must include pestcontrol pool [45, 50, 55, 60]");
  }
  if (!flashLibSrc.includes("FLASH_COUPON_SECONDS_MAX = 1200")) {
    fail("flash-coupon.ts countdown must span 12:00–20:00 (720–1200 s)");
  }
  const flashSrc = fs.readFileSync(FLASH, "utf8");
  if (!flashSrc.includes("buildFlashCouponBundle")) {
    fail("FlashCouponAnchor must use buildFlashCouponBundle");
  }
  if (!flashSrc.includes('data-ssr-coupon="1"')) {
    fail("FlashCouponAnchor must SSR coupon bar (data-ssr-coupon)");
  }
  if (!slugSrc.includes("nicheLabel={pageNicheLabel}")) {
    fail("[...slug].astro must pass nicheLabel={pageNicheLabel} to FlashCouponAnchor");
  }
  console.log(
    `[check-pest-biodiversity] source OK — ${pests.length} pests, panel wired in pestcontrol-only branch`,
  );
}

function walkHtml(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtml(p, out);
    else if (ent.isFile() && ent.name.endsWith(".html")) out.push(p);
  }
  return out;
}

function checkDist() {
  const dist = path.resolve(ROOT, (process.env.BUILD_ASSERT_DIST ?? "dist").trim());
  if (!fs.existsSync(dist)) {
    fail(`dist missing: ${dist} — run npm run build:pestcontrol first`);
  }
  const files = walkHtml(dist);
  const pestPages = files.filter((f) => isPestCityDetailRel(path.relative(dist, f)));
  if (pestPages.length === 0) {
    fail(`no pest city detail HTML under ${dist} (checked ${files.length} files)`);
  }
  const leaks = [];
  const missing = [];
  for (const file of files) {
    const rel = path.relative(dist, file).replace(/\\/g, "/");
    const html = fs.readFileSync(file, "utf8");
    const hasPanel = html.includes('class="pest-bio"') && html.includes("pest-bio__icon-wrap");
    const hasFlash = html.includes('class="pest-flash-offer"');
    const hasBottom = /over 45 species/i.test(html);
    const hasDetails = html.includes("pest-bio__details");
    const iconCount = (html.match(/pest-bio__icon-wrap/g) ?? []).length;

    if (isPestCityDetailRel(rel)) {
      if (!hasPanel || !hasFlash || !hasBottom || !hasDetails) {
        missing.push(`${rel} (panel=${hasPanel} flash=${hasFlash} bottom=${hasBottom} details=${hasDetails})`);
      } else if (iconCount < FEATURED) {
        missing.push(`${rel} (only ${iconCount} featured icons, need ${FEATURED})`);
      } else if (!/\$(45|50|55|60) OFF Emergency Pest Control in /.test(html)) {
        missing.push(`${rel} (flash copy missing entropy amount + "OFF Emergency [Niche] in [City]" mold)`);
      } else if (!/data-initial-seconds="(7[2-9]\d|8\d\d|9\d\d|1[01]\d\d|1200)"/.test(html)) {
        missing.push(`${rel} (flash countdown seed outside 720–1200 s window)`);
      } else if (!html.includes('data-ssr-coupon="1"')) {
        missing.push(`${rel} (flash bar missing SSR coupon marker — CLS risk if client-injected)`);
      } else {
        const flashIdx = html.indexOf('class="pest-flash-offer"');
        const heroIdx = html.indexOf('hero-flood-alert-band');
        if (flashIdx < 0 || heroIdx < 0 || flashIdx > heroIdx) {
          missing.push(`${rel} (flash bar must appear before hero band in static HTML)`);
        }
      }
    } else if (hasPanel && !/pest-bio/.test(rel)) {
      leaks.push(rel);
    }
  }
  if (leaks.length) {
    fail(`pest-bio panel leaked onto non-pest pages:\n  - ${leaks.slice(0, 15).join("\n  - ")}`);
  }
  if (missing.length) {
    fail(
      `${missing.length} pest detail page(s) missing biodiversity panel:\n  - ${missing.slice(0, 20).join("\n  - ")}`,
    );
  }
  console.log(
    `[check-pest-biodiversity] dist OK — ${pestPages.length} pest city detail page(s) with flash + panel + ${FEATURED} icons`,
  );
}

const mode = process.argv.includes("--source") ? "source" : "dist";
if (mode === "source") checkSource();
else checkDist();

#!/usr/bin/env node
/**
 * Fleet Flash Offer gate — all 6 commercial hubs.
 *
 *   node scripts/check-flash-coupon.mjs --source
 *   ACTIVE_COLLECTION=roofing node scripts/check-flash-coupon.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const FLASH_LIB = path.join(ROOT, "src", "lib", "flash-coupon.ts");
const SLUG_PAGE = path.join(ROOT, "src", "pages", "[...slug].astro");
const FLASH = path.join(ROOT, "src", "components", "FlashCouponAnchor.astro");
const BRIDGE = path.join(ROOT, "src", "components", "FlashCouponVpcBridge.astro");
const BRIDGE_MSG = path.join(ROOT, "src", "lib", "flash-coupon-vpc-message.ts");

const COMMERCIAL = [
  "roofing",
  "plumbing",
  "pestcontrol",
  "water-damage",
  "siding-services",
  "plumbing-v2",
];

const AMOUNT_PATTERN = {
  pestcontrol: /\$(45|50|55|60) OFF Emergency /,
  "water-damage": /\$(90|100|110|120) OFF Emergency /,
  roofing: /\$(75|100|125|150) OFF Emergency /,
  plumbing: /\$(50|60|70|80) OFF Emergency /,
  "plumbing-v2": /\$(50|60|70|80) OFF Emergency /,
  "siding-services": /\$(50|60|70|80) OFF Emergency /,
};

function fail(msg) {
  console.error(`[check-flash-coupon] FAIL: ${msg}`);
  process.exit(1);
}

function isCityDetailRel(rel) {
  const r = rel.replace(/\\/g, "/");
  if (/community-stewardship/i.test(r)) return false;
  if (/\/index\.html$/i.test(r) && /-\d{5}\//.test(r)) return true;
  if (/near-me\//i.test(r) && !/-\d{5}\//.test(r)) return false;
  if (/pest-control-[^/]+\/index\.html$/i.test(r)) return true;
  if (/-pest-exterminator-[^/]+\/index\.html$/i.test(r)) return true;
  return false;
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

function checkSource() {
  for (const p of [FLASH_LIB, SLUG_PAGE, FLASH, BRIDGE, BRIDGE_MSG]) {
    if (!fs.existsSync(p)) fail(`missing ${path.relative(ROOT, p)}`);
  }
  const libSrc = fs.readFileSync(FLASH_LIB, "utf8");
  for (const key of COMMERCIAL) {
    if (!libSrc.includes(`"${key}"`)) {
      fail(`flash-coupon.ts missing amount pool for ${key}`);
    }
  }
  if (!libSrc.includes("collectionUsesFlashCoupon")) {
    fail("flash-coupon.ts must export collectionUsesFlashCoupon");
  }
  if (!libSrc.includes("FLASH_COUPON_SECONDS_MAX = 1200")) {
    fail("flash-coupon.ts countdown must span 12:00–20:00 (720–1200 s)");
  }

  const flashSrc = fs.readFileSync(FLASH, "utf8");
  if (!flashSrc.includes("buildFlashCouponBundle")) {
    fail("FlashCouponAnchor must use buildFlashCouponBundle");
  }
  if (!flashSrc.includes('data-ssr-coupon="1"')) {
    fail("FlashCouponAnchor must SSR bar (data-ssr-coupon)");
  }
  if (!flashSrc.includes("href={telHref}")) {
    fail('FlashCouponAnchor "Claim now" must href={telHref} (direct dial)');
  }
  if (!/<script is:inline>/.test(flashSrc)) {
    fail("FlashCouponAnchor timer must use is:inline script");
  }

  const slugSrc = fs.readFileSync(SLUG_PAGE, "utf8");
  if (!slugSrc.includes("showFlashCoupon")) {
    fail("[...slug].astro must define showFlashCoupon");
  }
  if (!slugSrc.includes("collectionUsesFlashCoupon")) {
    fail("[...slug].astro must import collectionUsesFlashCoupon");
  }
  if (!slugSrc.includes("FlashCouponAnchor")) {
    fail("[...slug].astro must render FlashCouponAnchor");
  }
  if (!slugSrc.includes("nicheLabel={pageNicheLabel}")) {
    fail("[...slug].astro must pass nicheLabel={pageNicheLabel} to FlashCouponAnchor");
  }
  if (!slugSrc.includes("FlashCouponVpcBridge")) {
    fail("[...slug].astro must render FlashCouponVpcBridge with flash coupon");
  }
  if (!slugSrc.includes("couponLinkEnabled={showFlashCoupon}")) {
    fail("[...slug].astro must pass couponLinkEnabled to ValueProtectionCalculator");
  }
  const bridgeSrc = fs.readFileSync(BRIDGE, "utf8");
  if (!bridgeSrc.includes("vpc-coupon-popup")) {
    fail("FlashCouponVpcBridge must SSR vpc-coupon-popup dialog");
  }
  if (!/<script is:inline>/.test(bridgeSrc) || !bridgeSrc.includes("visibilitychange")) {
    fail("FlashCouponVpcBridge must use inline abandon-retarget script");
  }
  const bridgeMsgSrc = fs.readFileSync(BRIDGE_MSG, "utf8");
  if (!bridgeMsgSrc.includes("now secured")) {
    fail('flash-coupon-vpc-message.ts must include "now secured" copy');
  }
  if (!bridgeSrc.includes("buildFlashCouponVpcPopupMessage")) {
    fail("FlashCouponVpcBridge must use buildFlashCouponVpcPopupMessage");
  }
  for (const church of ["community-stewardship-water", "community-stewardship-siding", "community-stewardship-plumbing"]) {
    if (new RegExp(`["']${church}["']`).test(libSrc)) {
      fail(`flash-coupon.ts must not include church collection ${church}`);
    }
  }

  console.log(`[check-flash-coupon] source OK — ${COMMERCIAL.length} commercial collections`);
}

function checkDist() {
  const collection = (process.env.ACTIVE_COLLECTION ?? "").trim().toLowerCase();
  if (!COMMERCIAL.includes(collection)) {
    fail(`ACTIVE_COLLECTION must be one of: ${COMMERCIAL.join(", ")} (got "${collection}")`);
  }
  const amountRe = AMOUNT_PATTERN[collection];
  if (!amountRe) fail(`no amount pattern for ${collection}`);

  const dist = path.resolve(ROOT, (process.env.BUILD_ASSERT_DIST ?? "dist").trim());
  if (!fs.existsSync(dist)) {
    fail(`dist missing: ${dist} — run build first`);
  }

  const files = walkHtml(dist);
  const cityPages = files.filter((f) => isCityDetailRel(path.relative(dist, f)));
  if (cityPages.length === 0) {
    fail(`no city detail HTML under ${dist}`);
  }

  const missing = [];
  const leaks = [];
  for (const file of files) {
    const rel = path.relative(dist, file).replace(/\\/g, "/");
    const html = fs.readFileSync(file, "utf8");
    const hasFlash = html.includes('class="pest-flash-offer"');
    const hasTelCta = /pest-flash-offer__cta[^>]*href="tel:/.test(html);

    if (isCityDetailRel(rel)) {
      if (!hasFlash || !hasTelCta) {
        missing.push(`${rel} (flash=${hasFlash} telCta=${hasTelCta})`);
      } else if (!amountRe.test(html)) {
        missing.push(`${rel} (amount outside ${collection} entropy pool)`);
      } else if (!html.includes('data-ssr-coupon="1"')) {
        missing.push(`${rel} (missing SSR coupon marker)`);
      } else if (!html.includes("vpc-coupon-popup")) {
        missing.push(`${rel} (missing coupon→calculator VPC bridge popup)`);
      } else if (!html.includes('data-vpc-coupon-link="1"')) {
        missing.push(`${rel} (calculator missing coupon link marker)`);
      } else {
        const flashIdx = html.indexOf('class="pest-flash-offer"');
        const heroIdx = html.indexOf("hero-flood-alert-band");
        if (flashIdx < 0 || heroIdx < 0 || flashIdx > heroIdx) {
          missing.push(`${rel} (flash bar must precede hero band)`);
        }
      }
    } else if (hasFlash && /community-stewardship/i.test(rel)) {
      leaks.push(rel);
    }
  }

  if (leaks.length) {
    fail(`flash coupon leaked onto church pages:\n  - ${leaks.slice(0, 10).join("\n  - ")}`);
  }
  if (missing.length) {
    fail(
      `${missing.length} city page(s) missing flash coupon:\n  - ${missing.slice(0, 20).join("\n  - ")}`,
    );
  }

  console.log(
    `[check-flash-coupon] dist OK — ${collection}: ${cityPages.length} city page(s) with flash + tel CTA`,
  );
}

const mode = process.argv.includes("--source") ? "source" : "dist";
if (mode === "source") checkSource();
else checkDist();

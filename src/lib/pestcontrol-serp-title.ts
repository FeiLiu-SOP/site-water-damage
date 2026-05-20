/** Rockwell pest control SERP: hash templates + premium tier; full FixitGrid brand suffix. */

export const PEST_BRAND_SUFFIX = " | FixitGrid Local Dispatch Network";
/** Google SERP soft cap; fallbacks swap full phrases — never mid-word clip. */
export const PEST_TITLE_MAX = 120;
export const PEST_META_MAX = 155;

export function clipMetaDescription(text: string, max = PEST_META_MAX): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd().replace(/[,;\s]+$/, "")}…`;
}

function withPestTitleBrand(core: string): string {
  const c = core.trim();
  if (c.endsWith("FixitGrid Local Dispatch Network") || c.endsWith("FixitGrid")) {
    return c.length <= PEST_TITLE_MAX ? c : c;
  }
  const branded = `${c}${PEST_BRAND_SUFFIX}`;
  return branded;
}

export function assertPestTitleFits(title: string, context: string): string {
  const len = title.length;
  if (len > PEST_TITLE_MAX) {
    console.warn(`[pest-title] Title Truncated: ${len}>${PEST_TITLE_MAX} ctx=${context}`);
    throw new Error(
      `[pest-title] Title exceeds ${PEST_TITLE_MAX} characters (${len}). Refusing truncated SERP title. ctx=${context} title="${title}"`,
    );
  }
  return title;
}

function pickFirstPestTitle(cores: string[], context: string, branded = true): string {
  for (const core of cores) {
    const titled = branded ? withPestTitleBrand(core) : core.trim();
    if (titled.length <= PEST_TITLE_MAX) {
      return assertPestTitleFits(titled, context);
    }
  }
  const fallback = branded ? withPestTitleBrand(cores[cores.length - 1]!) : cores[cores.length - 1]!.trim();
  return assertPestTitleFits(fallback, context);
}

/** Template 0 — eradication guarantee. */
export function buildPestTemplate0Cores(city: string): string[] {
  return [
    `Emergency ${city} Pest Control: 100% Eradication & Verified`,
    `Emergency ${city} Pest: 100% Eradication & Verified`,
    `Emergency ${city} Pest Control: 100% Eradication`,
    `Emergency Pest Control: 100% Eradication & Verified`,
  ];
}

/** Template 1 — asset / structure protection. */
export function buildPestTemplate1Cores(city: string, valueToken: string): string[] {
  const z = valueToken || "Home";
  return [
    `Stop ${city} Infestation: Protect Your ${z} Home Asset`,
    `Stop ${city} Infestation: Protect Your ${z} Asset`,
    `Stop ${city} Pests: Protect Your ${z} Home Asset`,
    `Stop Infestation in ${city}: Protect Your ${z} Asset`,
  ];
}

/** Template 2 — audit / child & pet safe. */
export function buildPestTemplate2Cores(city: string): string[] {
  return [
    `2026 ${city} Pest Risk Audit: Child & Pet Safe Dispatch`,
    `2026 ${city} Pest Audit: Child & Pet Safe Dispatch`,
    `${city} Pest Risk Audit: Child & Pet Safe`,
    `2026 Pest Risk Audit: Child & Pet Safe Dispatch`,
  ];
}

export function buildPestPremiumTitleCores(city: string, zLabelExact: string): string[] {
  const z = zLabelExact.trim() || "Home";
  return [
    `PREMIUM: ${z} ${city} Pest Asset Audit | 2026 Deep Nest Defense`,
    `PREMIUM: ${city} Pest Asset Audit | 2026 Deep Nest Defense`,
    `PREMIUM: ${z} Pest Asset Audit | Deep Nest Defense`,
  ];
}

export function buildPestPageTitle(opts: {
  city: string;
  zLabel: string | null;
  zLabelExact: string | null;
  highValue: boolean;
  slug: string;
  pick: number;
}): string {
  const { city, zLabel, zLabelExact, highValue, slug, pick } = opts;
  const z = (zLabel ?? zLabelExact ?? "").trim();
  if (highValue && zLabelExact) {
    return pickFirstPestTitle(buildPestPremiumTitleCores(city, zLabelExact), `premium:${slug}`, false);
  }
  const r = pick % 3;
  if (r === 0) {
    return pickFirstPestTitle(buildPestTemplate0Cores(city), `t0:${slug}`);
  }
  if (r === 1) {
    return pickFirstPestTitle(buildPestTemplate1Cores(city, z), `t1:${slug}`);
  }
  return pickFirstPestTitle(buildPestTemplate2Cores(city), `t2:${slug}`);
}

export function buildPestH1(opts: {
  city: string;
  zLabel: string | null;
  zLabelExact: string | null;
}): string {
  const { city, zLabel, zLabelExact } = opts;
  const zDisplay = (zLabelExact ?? zLabel ?? "Home").trim();
  return `Verified ${city} Pest Experts — 100% Eradication Guarantee — Protecting your ${zDisplay} Asset`;
}

export function buildPestNestNotice(city: string): string {
  return `NOTICE: Your ${city} property has high-risk entry points. Our deep nest audit confirms your infestation status to prevent structural decay.`;
}

export function buildPestMetaDescription(city: string, stateCode: string): string {
  const st = stateCode.trim().toUpperCase() || "US";
  return clipMetaDescription(
    `Don't let pests eat your equity. Our verified ${city} dispatch ensures 100% child-safe eradication and structural risk audits. Search 'FixitGrid ${st}' for an immediate local response.`,
    PEST_META_MAX,
  );
}

export function buildBaitPool2TitlesPestcontrol(opts: {
  city: string;
  stateCode: string;
  zLabel: string | null;
  zLabelExact: string | null;
  highValue: boolean;
  slug: string;
  pick: number;
}): { pageTitle: string; pageH1: string; metaDescription: string } {
  const { city, stateCode } = opts;
  const pageTitle = buildPestPageTitle(opts);
  const pageH1 = buildPestH1(opts);
  const metaDescription = buildPestMetaDescription(city, stateCode);
  return { pageTitle, pageH1, metaDescription };
}

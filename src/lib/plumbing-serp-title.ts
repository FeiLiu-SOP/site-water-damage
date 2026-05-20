/** Rockwell plumbing SERP: ≤55-char titles, `| FixitGrid` suffix (aligned with roofing). */

export const PLUMBING_BRAND_SUFFIX = " | FixitGrid";
export const PLUMBING_TITLE_MAX = 55;
export const PLUMBING_META_MAX = 155;

export function clipMetaDescription(text: string, max = PLUMBING_META_MAX): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd().replace(/[,;\s]+$/, "")}…`;
}

function withPlumbingTitleBrand(core: string): string {
  const c = core.trim();
  return c.endsWith("FixitGrid") ? c : `${c}${PLUMBING_BRAND_SUFFIX}`;
}

export function assertPlumbingTitleFits(title: string, context: string): string {
  const len = title.length;
  if (len > PLUMBING_TITLE_MAX) {
    console.warn(`[plumbing-title] Title Truncated: ${len}>${PLUMBING_TITLE_MAX} ctx=${context}`);
    throw new Error(
      `[plumbing-title] Title exceeds ${PLUMBING_TITLE_MAX} characters (${len}). Refusing truncated SERP title. ctx=${context} title="${title}"`,
    );
  }
  return title;
}

function pickFirstPlumbingTitle(cores: string[], context: string): string {
  for (const core of cores) {
    const titled = withPlumbingTitleBrand(core);
    if (titled.length <= PLUMBING_TITLE_MAX) {
      return assertPlumbingTitleFits(titled, context);
    }
  }
  const fallback = withPlumbingTitleBrand(cores[cores.length - 1]!);
  return assertPlumbingTitleFits(fallback, context);
}

export function buildPlumbingLowTitleCore(city: string): string[] {
  return [
    `Emergency ${city} Plumber: $0 Dispatch & Verified`,
    `${city} Plumber: $0 Dispatch & Verified`,
    `Emergency ${city} Plumb: $0 Dispatch & Verified`,
    `Emergency ${city} Plumbing: $0 Dispatch & Verified`,
    `${city} Emergency Plumber: $0 Dispatch & Verified`,
    `Emergency Plumber: $0 Dispatch & Verified`,
  ];
}

export function buildPlumbingHighTitleCore(city: string, valueToken: string): string[] {
  return [
    `${city} Plumbing Audit: Protect ${valueToken} Asset`,
    `${city} Plumber Audit: Protect ${valueToken} Asset`,
    `${city} Plumber Audit: ${valueToken} Asset`,
    `Plumbing Audit: Protect ${valueToken} Asset`,
  ];
}

export function plumbingHookForTier(highValue: boolean): string {
  return highValue ? "Emergency Audit" : "$0 Dispatch & Verified";
}

export function buildPlumbingMetaDescription(city: string, stateCode: string): string {
  const st = stateCode.trim().toUpperCase() || "US";
  return clipMetaDescription(
    `Stop overpaying. Get upfront pricing and verified plumbing for ${city} residents. No hidden dispatch fees. Search 'FixitGrid ${st}' for emergency dispatch.`,
    PLUMBING_META_MAX,
  );
}

export function buildPlumbingPageTitle(opts: {
  city: string;
  zLabel: string | null;
  zLabelExact: string | null;
  highValue: boolean;
  slug: string;
}): string {
  const { city, zLabel, zLabelExact, highValue, slug } = opts;
  const z = (zLabel ?? zLabelExact ?? "").trim();
  if (highValue) {
    return pickFirstPlumbingTitle(buildPlumbingHighTitleCore(city, z || "Home"), `high:${slug}`);
  }
  return pickFirstPlumbingTitle(buildPlumbingLowTitleCore(city), `low:${slug}`);
}

export function buildPlumbingH1(opts: {
  city: string;
  zLabel: string | null;
  zLabelExact: string | null;
  highValue: boolean;
}): string {
  const { city, zLabel, zLabelExact, highValue } = opts;
  const zDisplay = (zLabelExact ?? zLabel ?? "Home").trim();
  const hook = plumbingHookForTier(highValue);
  return `Verified ${city} Plumber — ${hook} — Protecting your ${zDisplay} Asset`;
}

export function buildBaitPool2TitlesPlumbing(opts: {
  city: string;
  stateCode: string;
  zLabel: string | null;
  zLabelExact: string | null;
  highValue: boolean;
  slug: string;
}): { pageTitle: string; pageH1: string; metaDescription: string } {
  const { city, stateCode, highValue } = opts;
  const pageTitle = buildPlumbingPageTitle(opts);
  const pageH1 = buildPlumbingH1(opts);
  const metaDescription = buildPlumbingMetaDescription(city, stateCode);
  return { pageTitle, pageH1, metaDescription };
}

/** Rockwell roofing SERP titles: ≤55 chars, full words only, no mid-token clip. */

export const ROOFING_BRAND_SUFFIX = " | FixitGrid";
export const ROOFING_TITLE_MAX = 55;
export const ROOFING_META_MAX = 155;

export function clipMetaDescription(text: string, max = ROOFING_META_MAX): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd().replace(/[,;\s]+$/, "")}…`;
}

function withRoofingTitleBrand(core: string): string {
  const c = core.trim();
  return c.endsWith("FixitGrid") ? c : `${c}${ROOFING_BRAND_SUFFIX}`;
}

/** Build fails if no candidate fits — never ship a truncated SERP title. */
export function assertRoofingTitleFits(title: string, context: string): string {
  const len = title.length;
  if (len > ROOFING_TITLE_MAX) {
    console.warn(`[roofing-title] Title Truncated: ${len}>${ROOFING_TITLE_MAX} ctx=${context}`);
    throw new Error(
      `[roofing-title] Title exceeds ${ROOFING_TITLE_MAX} characters (${len}). Refusing truncated SERP title. ctx=${context} title="${title}"`,
    );
  }
  return title;
}

function pickFirstRoofingTitle(cores: string[], context: string): string {
  for (const core of cores) {
    const titled = withRoofingTitleBrand(core);
    if (titled.length <= ROOFING_TITLE_MAX) {
      return assertRoofingTitleFits(titled, context);
    }
  }
  const fallback = withRoofingTitleBrand(cores[cores.length - 1]!);
  return assertRoofingTitleFits(fallback, context);
}

export function buildRoofingLowTitleCore(city: string): string[] {
  return [
    `Emergency ${city} Roofing: $0 Dispatch & Verified`,
    `Emergency ${city} Roof: $0 Dispatch & Verified`,
    `${city} Emergency Roof: $0 Dispatch & Verified`,
    `Emergency Roof: $0 Dispatch & Verified`,
  ];
}

export function buildRoofingHighTitleCore(city: string, valueToken: string): string[] {
  return [
    `${city} Roofing Audit: Protect ${valueToken} Asset`,
    `${city} Roof Audit: Protect ${valueToken} Asset`,
    `${city} Roof Audit: ${valueToken} Asset`,
    `Roof Audit: Protect ${valueToken} Asset`,
  ];
}

export function buildRoofingPageTitle(opts: {
  city: string;
  zLabel: string | null;
  zLabelExact: string | null;
  highValue: boolean;
  slug: string;
}): string {
  const { city, zLabel, zLabelExact, highValue, slug } = opts;
  const z = (zLabel ?? zLabelExact ?? "").trim();
  if (highValue) {
    return pickFirstRoofingTitle(
      buildRoofingHighTitleCore(city, z || "Home"),
      `high:${slug}`,
    );
  }
  return pickFirstRoofingTitle(buildRoofingLowTitleCore(city), `low:${slug}`);
}

export function buildBaitPool2TitlesRoofing(opts: {
  city: string;
  zLabel: string | null;
  zLabelExact: string | null;
  highValue: boolean;
  slug: string;
}): { pageTitle: string; pageH1: string; metaDescription: string } {
  const { city, zLabel, zLabelExact, highValue } = opts;
  const z = (zLabel ?? zLabelExact ?? "").trim();
  const pageH1 = `${city} Roofing & Asset Defense`;
  const pageTitle = buildRoofingPageTitle(opts);

  if (highValue) {
    const metaDescription = clipMetaDescription(
      z
        ? `Protect your ${z} home value. Our USGS-driven audit for ${city} prevents overcharging. Get a verified inspection now.`
        : `Protect your home value. Our USGS-driven audit for ${city} prevents overcharging. Get a verified inspection now.`,
      ROOFING_META_MAX,
    );
    return { pageTitle, pageH1, metaDescription };
  }

  const metaDescription = clipMetaDescription(
    `${city} roofing services. Stop overpaying. Our local audit prevents scams and hidden fees. Get your emergency dispatch quote today.`,
    ROOFING_META_MAX,
  );
  return { pageTitle, pageH1, metaDescription };
}

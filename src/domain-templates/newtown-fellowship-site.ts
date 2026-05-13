/**
 * Newtown Fellowship 垂直站 — 与 Rockwell / FixitGrid 商业指纹物理隔离。
 * 通过构建期 canonical / site URL 识别；本地可设 `PUBLIC_NEWTOWN_FELLOWSHIP_FINGERPRINT=1` 验收。
 */

const HOST_SUFFIXES = [
  "newtownbaptistfellowship.com",
  "newtownfellowship.org",
] as const;

function hostMatchesNewtown(host: string): boolean {
  const h = host.replace(/^www\./i, "").toLowerCase();
  return HOST_SUFFIXES.some((s) => h === s || h.endsWith(`.${s}`));
}

function urlMatches(raw: string | undefined): boolean {
  const t = (raw ?? "").trim();
  if (!t) return false;
  try {
    const u = new URL(t.includes("://") ? t : `https://${t}`);
    return hostMatchesNewtown(u.hostname);
  } catch {
    return HOST_SUFFIXES.some((s) => t.toLowerCase().includes(s));
  }
}

export function matchesNewtownFellowshipSite(urls: {
  canonicalOrigin?: string;
  siteUrl?: string;
}): boolean {
  const flag = (import.meta.env.PUBLIC_NEWTOWN_FELLOWSHIP_FINGERPRINT as string | undefined)
    ?.trim()
    .toLowerCase();
  if (flag === "1" || flag === "true" || flag === "yes") return true;
  return urlMatches(urls.canonicalOrigin) || urlMatches(urls.siteUrl);
}

/** JSON-LD / canonical：指纹站构建若误带主站 `PUBLIC_CANONICAL_ORIGIN`，仍回落到教堂主域，避免 Breadcrumb 泄漏 Rockwell。 */
export const NEWTOWN_FELLOWSHIP_DEFAULT_ORIGIN = "https://newtownbaptistfellowship.com" as const;

/**
 * 解析本域 origin（无尾斜杠）。仅当 canonical / siteUrl 已指向 Newtown 主机时使用其 origin；
 * 否则使用 {@link NEWTOWN_FELLOWSHIP_DEFAULT_ORIGIN}（与架构师指令「严禁主站域名」一致）。
 */
export function resolveNewtownFellowshipPublicOrigin(urls: {
  canonicalOrigin?: string;
  siteUrl?: string;
}): string {
  for (const raw of [urls.canonicalOrigin, urls.siteUrl]) {
    const t = (raw ?? "").trim();
    if (!t) continue;
    if (!urlMatches(t)) continue;
    try {
      const u = new URL(t.includes("://") ? t : `https://${t}`);
      return u.origin;
    } catch {
      /* fall through */
    }
  }
  return NEWTOWN_FELLOWSHIP_DEFAULT_ORIGIN;
}

/** 与 `site-config.canonicalPageUrl` 相同规则，但使用教堂站 origin。 */
export function newtownFellowshipCanonicalPageUrl(originBase: string, ...segments: string[]): string {
  const base = originBase.replace(/\/$/, "");
  const parts = segments
    .filter((s) => s != null && s !== "")
    .map((s) => String(s).replace(/^\/+|\/+$/g, ""));
  if (parts.length === 0) return `${base}/`;
  return `${base}/${parts.join("/")}/`;
}

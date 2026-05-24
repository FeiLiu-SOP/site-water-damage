import { getCanonicalBase } from "../site-config";

/** Hub path prefix from Astro base (e.g. /plumbing/). Empty when base is /. */
function hubPathPrefix(): string {
  const raw = import.meta.env.BASE_URL ?? "/";
  const trimmed = raw.replace(/\/+$/, "");
  if (!trimmed || trimmed === "/") return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/**
 * Absolute og:image URL for city detail pages.
 * Must match Worker R2 key: {segment}/images/thumbnails/{slug}.jpg
 */
export function ogThumbnailUrl(entrySlug: string): string {
  const slug = entrySlug.trim().replace(/\.(md|mdx)$/i, "");
  return `${getCanonicalBase()}${hubPathPrefix()}/images/thumbnails/${slug}.jpg`;
}

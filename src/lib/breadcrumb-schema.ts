/**
 * 详情页 BreadcrumbList JSON-LD。层级与 `pages/index`、`pages/[state]/index`、`pages/[...slug]` 生成的路由一致。
 * Home 与「服务 Hub」在本仓库单集合部署中对应同一索引 URL（不虚构上一级域名根路径）。
 */

export type BreadcrumbListItem = {
  name: string;
  /** 绝对 URL，须与 canonicalPageUrl 输出一致（含尾斜杠） */
  item: string;
};

export function buildBreadcrumbListSchema(items: BreadcrumbListItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((row, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: row.name,
      item: row.item,
    })),
  };
}

/**
 * 城市详情页：Home > [服务] hub > [州] hub > [城市节点]
 * - 服务 hub 与 Home 共用索引 URL 时仍保留两级命名，满足信息架构；URL 重复为真实路由限制所致。
 */
export function buildSlugPageBreadcrumbItems(args: {
  canonicalPageUrl: (...segments: string[]) => string;
  serviceHubLabel: string;
  stateCode: string | null;
  cityDisplayName: string | null;
  entrySlug: string;
}): BreadcrumbListItem[] {
  const { canonicalPageUrl, serviceHubLabel, stateCode, cityDisplayName, entrySlug } = args;
  const homeUrl = canonicalPageUrl();
  const serviceHubUrl = canonicalPageUrl();

  const items: BreadcrumbListItem[] = [
    { name: "Home", item: homeUrl },
    { name: `${serviceHubLabel} hub`, item: serviceHubUrl },
  ];

  if (stateCode && /^[A-Z]{2}$/.test(stateCode)) {
    const stLower = stateCode.toLowerCase();
    items.push({
      name: `${stateCode} hub`,
      item: canonicalPageUrl(stLower),
    });
  }

  const cityLeaf =
    cityDisplayName && stateCode
      ? `${cityDisplayName}, ${stateCode}`
      : cityDisplayName ?? entrySlug.replace(/\.(md|mdx)$/i, "");

  items.push({
    name: cityLeaf,
    item: canonicalPageUrl(entrySlug.replace(/\.(md|mdx)$/i, "")),
  });

  return items;
}

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const collectionSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date().optional(),
  updatedDate: z.coerce.date().optional(),
  heroImage: z.string().optional(),
  /** 可选：若填写则优先用于 LocalBusiness areaServed；不填则从标题或文件名解析 */
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  templateVersion: z.string().optional(),
  /** 可选：用于页面“地理简报”分区展示（纯展示字段，来自 Go 生成器/数据预处理） */
  county: z.string().optional(),
  elevationFt: z.number().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  zipSample: z.array(z.string()).optional(),
  zipCodes: z.array(z.string()).optional(),
  localPaths: z.array(z.string()).optional(),
  /** 可选：Zillow 类典型房价中位数（USD），用于 <title> / meta 的「资产锚点」注入；不填则诱饵模版 A 自动降级为 B/C */
  zillowHomeValueUsd: z.number().optional(),
  /** 可选：财务数据可信度；`estimated` 表示州/全国均价降权孤儿回填（非 CSV 精确命中） */
  data_fidelity: z.enum(["estimated", "synthetic"]).optional(),
});

const roofing = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/roofing" }),
  schema: collectionSchema,
});

const plumbing = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/plumbing" }),
  schema: collectionSchema,
});

const pestcontrol = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pestcontrol" }),
  schema: collectionSchema,
});

const waterDamage = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/water-damage" }),
  schema: collectionSchema,
});

const sidingServices = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/siding-services" }),
  schema: collectionSchema,
});

const plumbingV2 = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/plumbing-v2" }),
  schema: collectionSchema,
});

/** 新垂直：在此增加 `defineCollection` + 目录 `src/content/<niche>/`，并改 `active-collection.ts` 的 ALLOWED */
export const collections = {
  roofing,
  plumbing,
  pestcontrol,
  "water-damage": waterDamage,
  "siding-services": sidingServices,
  "plumbing-v2": plumbingV2,
};

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const collectionSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date().optional(),
  updatedDate: z.coerce.date().optional(),
  heroImage: z.string().optional(),
});

const roofing = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/roofing" }),
  schema: collectionSchema,
});

const plumbing = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/plumbing" }),
  schema: collectionSchema,
});

/** 新垂直：在此增加 `defineCollection` + 目录 `src/content/<niche>/`，并改 `active-collection.ts` 的 ALLOWED */
export const collections = { roofing, plumbing };

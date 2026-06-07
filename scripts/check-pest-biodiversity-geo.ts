/**
 * Geo-species paradox gate — IL must not feature scorpions; details list capped at 15.
 */
import { buildPestBiodiversityBundle } from "../src/lib/pest-biodiversity.ts";

const zion = buildPestBiodiversityBundle({
  entrySlug: "pest-control-zion-il-60099",
  city: "Zion",
  stateCode: "IL",
  stateLabel: "Illinois",
});

const featuredIds = zion.featured.map((p) => p.id);
if (featuredIds.includes("scorpions")) {
  console.error("[check-pest-biodiversity-geo] FAIL: scorpions featured on Zion, IL");
  process.exit(1);
}
if (featuredIds.includes("fire-ants")) {
  console.error("[check-pest-biodiversity-geo] FAIL: fire-ants featured on Zion, IL");
  process.exit(1);
}
if (zion.sectionTitle !== "Local Pest Control & Inspection in Zion") {
  console.error(`[check-pest-biodiversity-geo] FAIL: bad title: ${zion.sectionTitle}`);
  process.exit(1);
}
if (zion.detailsSubset.length !== 15) {
  console.error(`[check-pest-biodiversity-geo] FAIL: details subset ${zion.detailsSubset.length}, want 15`);
  process.exit(1);
}
if (zion.detailsSubset.some((p) => p.id === "scorpions")) {
  console.error("[check-pest-biodiversity-geo] FAIL: scorpions in IL details subset");
  process.exit(1);
}

const phoenix = buildPestBiodiversityBundle({
  entrySlug: "pest-control-phoenix-az-85001",
  city: "Phoenix",
  stateCode: "AZ",
  stateLabel: "Arizona",
});
if (!phoenix.featured.some((p) => p.id === "scorpions" || p.id === "fire-ants")) {
  console.error("[check-pest-biodiversity-geo] WARN: AZ page may lack desert priority pest in top 6 (soft)");
}

console.log("[check-pest-biodiversity-geo] OK — IL excludes desert_south; title + 15-item subset");

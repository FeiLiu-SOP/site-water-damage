/**
 * Context-Aware Summary: deterministic prose (100–300 words) with ZIP / State / Niche / city baked in.
 */

export type ContextSummaryInput = {
  seedSlug: string;
  collectionKey: string;
  nicheLabel: string;
  zip5: string;
  stateCode: string | null;
  cityDisplay: string | null;
};

function stableHash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function wordCount(s: string): number {
  return s
    .trim()
    .split(/\s+/g)
    .filter((w) => w.length > 0).length;
}

const SENTENCE_TEMPLATES = [
  "This intake page anchors {niche} coordination for ZIP {zip} in {state}, with {city} treated as the primary locality label for routing context.",
  "Dispatch documentation for {niche} references {state} statutes and corridor norms; ZIP {zip} is the scheduling key used when crews confirm coverage windows.",
  "Homeowners near {city} ({zip}, {state}) should treat {niche} guidance here as educational routing context, not a field measurement or insurer determination.",
  "The {state} node for {niche} prioritizes verified ZIP {zip} intake before assigning technician pools; {city} appears in the headline to align with municipal naming conventions.",
  "Seasonal demand for {niche} in {state} can shift same-day availability around ZIP {zip}; {city} residents should expect transparent timing notes during peak weather windows.",
  "Material lead times and permit latency discussed for {niche} apply broadly to {state}; ZIP {zip} is used only as a dispatch anchor tied to {city}.",
  "Moisture, wind, and soil language on this page is generic climatology framing for {state}, not a property-specific report for {city} or ZIP {zip}.",
  "If {niche} scope expands after roof or envelope strip-off, revised estimates should be confirmed before authorization; {state} rules and ZIP {zip} intake notes may both apply.",
  "Call routing for {niche} may reference {city} plus ZIP {zip} to reduce duplicate tickets across {state} county lines.",
  "Documentation cadence for {niche} encourages photo capture when available; {city} ({zip}) entries remain informational for {state} compliance desks.",
  "After-hours premiums for {niche} are separated from diagnostic trips in many {state} markets; ZIP {zip} scheduling does not imply a live queue depth display.",
  "Insurance questions mentioned under {niche} are informational only; {city} homeowners in ZIP {zip} should verify coverage with their carrier in {state}.",
  "Technician licensing for {niche} varies by {state} county; ZIP {zip} is used to align intake with regional partner availability near {city}.",
  "Hazard framing for {niche} uses regional archetypes for {state}, not a calibrated site survey for {city} or ZIP {zip}.",
  "Ventilation and vapor-drive notes for {niche} describe common failure modes in {state} housing stock; ZIP {zip} routing does not replace attic inspection.",
  "Drainage and gutter overflow context for {niche} can influence fascia concerns in {state}; {city} ZIP {zip} is a label for dispatch alignment only.",
  "Fastener schedules and wind ratings referenced for {niche} assume manufacturer tables; {state} code minimums may differ for ZIP {zip} jurisdictions near {city}.",
  "Thermal bridging language for {niche} highlights transitions at parapets and abutments common in {state}; {city} intake still keys on ZIP {zip}.",
  "Ice dam and snow-load wording for {niche} is seasonal education for {state}; ZIP {zip} does not encode a live weather warning for {city}.",
  "Coastal salt-air clauses for {niche} matter in some {state} shore belts; {city} at ZIP {zip} may still be inland—treat coastal text as conditional context.",
  "Freeze-thaw joint stress notes for {niche} describe mid-continent patterns in {state}; ZIP {zip} is not a geotechnical report for {city}.",
  "Clay soil expansion language for {niche} is generic subsoil education in {state}; {city} homeowners near ZIP {zip} should confirm local bearing conditions separately.",
  "Wildland-urban interface wording for {niche} is episodic risk education for parts of {state}; ZIP {zip} routing does not read live fire perimeters for {city}.",
  "Karst and groundwater variability text for {niche} is cave-region shorthand in {state}; {city} ZIP {zip} intake is not a hydrogeology study.",
  "Riverine humidity bands for {niche} describe floodplain-adjacent microclimates in {state}; ZIP {zip} labels do not replace FEMA maps for {city}.",
  "Urban heat island notes for {niche} explain slower nocturnal cooling in dense {state} cores; {city} ZIP {zip} remains a dispatch key only.",
  "Marine-layer condensation cycles for {niche} can soften seal-down timing in some {state} coasts; {city} at ZIP {zip} may not experience marine layers.",
  "Interior vapor drive for {niche} in winter can overload air barriers in {state}; ZIP {zip} coordination still requires blower-door data on site near {city}.",
  "Hail-prone corridor language for {niche} references historical storm tracks across {state}; ZIP {zip} does not assert a current hail watch for {city}.",
  "Derecho straight-line wind education for {niche} applies to select {state} seasons; {city} ZIP {zip} intake is not a severe thunderstorm alert.",
  "Low-slope internal drain wording for {niche} highlights debris-load scenarios in {state} flat roofs; ZIP {zip} is used for routing, not hydraulic modeling for {city}.",
  "Chimney cricket ponding notes for {niche} describe counter-flashing laps common in {state}; {city} ZIP {zip} does not confirm cricket dimensions on your roof.",
  "Skylight curb slope-change language for {niche} flags leak-prone transitions in {state} retrofits; ZIP {zip} scheduling is independent of curb geometry at {city}.",
  "Ridge vent neutral pressure assumptions for {niche} vary under {state} wind events; {city} ZIP {zip} text is not a ventilation balance test.",
  "Attic dew-point risk for {niche} can rise when exhaust short-circuits in {state} attics; ZIP {zip} intake for {city} still needs on-site psychrometrics.",
  "Metal panel clip galling language for {niche} warns about expansion runs in {state} heat; ZIP {zip} routing does not verify clip schedules at {city}.",
  "Membrane lap peel notes for {niche} describe cold-snap-after-warm-rain sequences in {state}; {city} ZIP {zip} is not a warranty adjudication.",
  "Self-adhered membrane bond-line education for {niche} references shoulder-season tack in {state}; ZIP {zip} labels do not replace manufacturer data sheets for {city}.",
  "WRB continuity strip-off notes for {niche} explain why scopes change in {state} reclads; {city} ZIP {zip} intake cannot see behind existing cladding remotely.",
  "Scaffold and ladder-day sequencing for {niche} affects calendar density in {state}; ZIP {zip} timing for {city} is still subject to crew availability.",
  "Silica control language for {niche} references fiber-cement cutting in {state} jobsites; ZIP {zip} coordination does not certify containment at {city}.",
  "Color-lot variance for {niche} partial elevations is called out for {state} exteriors; {city} ZIP {zip} does not guarantee panel dye lots.",
  "Manufacturer wind ratings for {niche} assume correct fastener schedules in {state}; ZIP {zip} intake for {city} is not a field verification sign-off.",
  "PRV and gauge verification language for {niche} applies to accessible gauges in {state} plumbing; ZIP {zip} routing for {city} is not a pressure test log.",
  "Slab leak listening-equipment notes for {niche} describe exploratory paths in {state}; ZIP {zip} for {city} does not promise same-day listening results.",
  "Trap assembly versus stop scope for {niche} itemizes common {state} billing splits; ZIP {zip} labels do not replace written estimates for {city}.",
  "Filtration education for {niche} is not laboratory testing in {state}; ZIP {zip} intake for {city} remains non-diagnostic.",
  "Water-heater permit latency for {niche} varies by AHJ in {state}; ZIP {zip} scheduling near {city} should include permit lead-time buffers.",
  "Termite label-interval language for {niche} follows registered directions in {state}; ZIP {zip} for {city} is not a pesticide application record.",
  "Wood repair versus liquid treatment split for {niche} is a common {state} scope fork; ZIP {zip} intake does not guarantee same-week liquid application in {city}.",
  "Aquarium and pet re-entry interval notes for {niche} are safety intake prompts in {state}; ZIP {zip} routing for {city} still needs household confirmation.",
  "IICRC drying goal language for {niche} references industry readings in {state}; ZIP {zip} for {city} is not a psychrometric chart for your structure.",
  "Carrier-pay versus homeowner-pay segmentation for {niche} should be clarified before equipment set in {state}; ZIP {zip} labels do not adjudicate coverage for {city}.",
  "Contents pack-out deferral language for {niche} reflects capacity constraints in {state}; ZIP {zip} intake for {city} is not a pack-out guarantee.",
] as const;

function fill(t: string, p: ContextSummaryInput): string {
  const state = p.stateCode ?? "US";
  const city = p.cityDisplay?.trim() || "the listed locality";
  return t
    .replace(/\{niche\}/g, p.nicheLabel)
    .replace(/\{zip\}/g, p.zip5)
    .replace(/\{state\}/g, state)
    .replace(/\{city\}/g, city)
    .replace(/\{collection\}/g, p.collectionKey);
}

export function buildContextAwareSummary(p: ContextSummaryInput): string {
  const target = 100 + (stableHash(`${p.seedSlug}|caswc`) % 201);
  const n = SENTENCE_TEMPLATES.length;
  let out = "";
  let i = 0;
  while (wordCount(out) < target && i < 400) {
    const idx = stableHash(`${p.seedSlug}|cas${i}`) % n;
    const piece = fill(SENTENCE_TEMPLATES[idx]!, p);
    out = out ? `${out} ${piece}` : piece;
    i++;
  }
  const words = out.trim().split(/\s+/g).filter(Boolean);
  if (words.length > 300) {
    return words.slice(0, 300).join(" ").replace(/\s*[,;:]\s*$/, "") + ".";
  }
  if (words.length < 100) {
    let j = i;
    while (wordCount(out) < 100 && j < 500) {
      const idx = stableHash(`${p.seedSlug}|caspad${j}`) % n;
      out = `${out} ${fill(SENTENCE_TEMPLATES[idx]!, p)}`;
      j++;
    }
  }
  return out.trim();
}

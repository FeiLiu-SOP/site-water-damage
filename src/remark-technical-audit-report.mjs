/**
 * Re-skins commercial-hub MD body paragraphs into a three-layer technical audit report.
 * Text content and paragraph order are preserved (Jaccard-safe); only HTML structure/CSS changes.
 */
import path from "node:path";

const COMMERCIAL_HUBS = new Set([
  "roofing",
  "plumbing",
  "pestcontrol",
  "water-damage",
  "siding-services",
  "plumbing-v2",
]);

function stableHash(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function stableCode(text, slug, index) {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const letter = letters[stableHash(`${slug}|${index}|${text}`) % letters.length];
  const num = 100 + (stableHash(`${slug}|code|${text}`) % 900);
  return `${letter}-${num}`;
}

function paragraphText(node) {
  let s = "";
  for (const c of node.children || []) {
    if (c.type === "text") s += c.value;
    if (c.type === "strong") s += paragraphText(c);
  }
  return s.trim();
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightLocalTokens(text, fm) {
  let out = escapeHtml(text);
  const city = String(fm.city ?? "").trim();
  const state = String(fm.state ?? "").trim();
  const county = String(fm.county ?? "").trim();
  const zip = String(fm.zipCode ?? "").trim();
  const tokens = [city, county, zip, state ? `${city}, ${state}` : "", state].filter(
    (t) => t.length > 2,
  );
  const seen = new Set();
  for (const tok of tokens.sort((a, b) => b.length - a.length)) {
    const key = tok.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out = out.replace(new RegExp(escapeRegExp(tok), "gi"), '<strong class="cta-loc">$&</strong>');
  }
  if (zip) {
    out = out.replace(
      new RegExp(`\\bZIP\\s*${escapeRegExp(zip)}\\b`, "gi"),
      '<strong class="cta-loc">$&</strong>',
    );
  }
  return out;
}

function classifyParagraph(text) {
  const t = text.toLowerCase();
  if (
    /^(tip|step|service reference|about us|book |request |schedule )/i.test(text) ||
    /serving zip code:/i.test(text) ||
    /^faq:/i.test(text)
  ) {
    return "directive";
  }
  if (
    /\b(soil|moisture|elevation|humidity|mesh label|regional mesh|seasonal cue|terrain|clay|coords?|coordinate|zip-corridor|dispatch sectors|on-site sector|primary zip|wind|thaw|irrigation|psychrometric|drying packet|mitigation ledger)\b/i.test(
      t,
    )
  ) {
    return "environment";
  }
  return "field";
}

function envIcon(text) {
  const t = text.toLowerCase();
  if (/\b(soil|clay|terrain|elevation)\b/.test(t)) return "Terrain";
  if (/\b(moisture|humidity|irrigation)\b/.test(t)) return "Moisture";
  if (/\b(coord|gps|lat|lng|zip-corridor|sector marker)\b/.test(t)) return "GPS";
  return "Env";
}

function renderEnvItem(text, fm, slug, index) {
  const icon = envIcon(text);
  return `<div class="cta-env-card"><span class="cta-env-icon" aria-hidden="true">[${icon}]</span><p>${highlightLocalTokens(text, fm)}</p></div>`;
}

function renderFieldItem(text, fm, slug, index) {
  const code = stableCode(text, slug, index);
  return `<div class="cta-field-row"><span class="cta-field-code">[CODE-${code}]</span><p>${highlightLocalTokens(text, fm)}</p></div>`;
}

function renderDirectiveItem(text, fm, slug, index) {
  const code = stableCode(text, slug, index);
  return `<div class="cta-directive-row"><span class="cta-directive-code">${code}:</span><p>${highlightLocalTokens(text, fm)}</p></div>`;
}

function buildAuditHtml(groups, fm, slug, auditDate) {
  const env = groups.environment;
  const field = groups.field;
  const directive = groups.directive;
  const city = escapeHtml(String(fm.city ?? "Local").trim() || "Local");

  const envBlock = env.length
    ? `<section class="cta-layer cta-layer--environment" aria-labelledby="cta-env-title">
        <h3 id="cta-env-title" class="cta-layer__title">Environmental Diagnostics</h3>
        <div class="cta-env-grid">${env.map((item, i) => renderEnvItem(item.text, fm, slug, i)).join("")}</div>
      </section>`
    : "";

  const fieldBlock = field.length
    ? `<section class="cta-layer cta-layer--field" aria-labelledby="cta-field-title">
        <h3 id="cta-field-title" class="cta-layer__title">Field Evaluation Notes</h3>
        <div class="cta-field-list">${field.map((item, i) => renderFieldItem(item.text, fm, slug, i)).join("")}</div>
      </section>`
    : "";

  const directiveBlock = directive.length
    ? `<section class="cta-layer cta-layer--directive" aria-labelledby="cta-directive-title">
        <h3 id="cta-directive-title" class="cta-layer__title">Operational Directives</h3>
        <div class="cta-directive-panel">${directive.map((item, i) => renderDirectiveItem(item.text, fm, slug, i)).join("")}</div>
      </section>`
    : "";

  return `<div class="certified-technical-audit" data-city="${city}">
    <div class="cta-audit-header">CERTIFIED TECHNICAL AUDIT — ${escapeHtml(auditDate)}</div>
    ${envBlock}
    ${fieldBlock}
    ${directiveBlock}
  </div>`;
}

function isEngineeringNotice(text) {
  return /engineering notice for/i.test(text);
}

/**
 * @param {{ collection?: string }} [options]
 */
export function remarkTechnicalAuditReport(options = {}) {
  const collection = String(options.collection ?? "").toLowerCase().trim();
  if (!COMMERCIAL_HUBS.has(collection)) {
    return () => {};
  }

  return (tree, file) => {
    if (!tree?.children?.length) return;

    const slug = path.basename(String(file.path ?? ""), path.extname(String(file.path ?? "")));
    const fm = file.data ?? {};
    const auditDate = new Date().toISOString().slice(0, 10);

    const leading = [];
    const body = [];

    for (const child of tree.children) {
      if (child.type !== "paragraph") {
        body.push(child);
        continue;
      }
      const text = paragraphText(child);
      if (!text) continue;
      if (leading.length === 0 && isEngineeringNotice(text)) {
        leading.push(child);
      } else {
        body.push(child);
      }
    }

    const paragraphs = body.filter((n) => n.type === "paragraph").map((n) => ({ text: paragraphText(n) }));
    const nonParagraphs = body.filter((n) => n.type !== "paragraph");

    if (paragraphs.length < 3) {
      return;
    }

    const groups = { environment: [], field: [], directive: [] };
    for (const p of paragraphs) {
      if (!p.text) continue;
      groups[classifyParagraph(p.text)].push(p);
    }

    const auditHtml = {
      type: "html",
      value: buildAuditHtml(groups, fm, slug, auditDate),
    };

    tree.children = [...leading, auditHtml, ...nonParagraphs];
  };
}

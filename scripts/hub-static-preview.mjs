/**
 * Local preview for Hub layout: HTML under dist/<segment>/ (nest-hub-segment).
 * Usage: node ./scripts/hub-static-preview.mjs [segment] [--port 4321]
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "dist");

const argv = process.argv.slice(2);
let segment = "water-damage";
let port = Number(process.env.PORT || 4321);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--port" && argv[i + 1]) {
    port = Number(argv[i + 1]);
    i++;
  } else if (!argv[i].startsWith("-")) {
    segment = argv[i];
  }
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function unsafeSegments(segments) {
  return segments.some((x) => x === ".." || x.includes("\0"));
}

function resolveUnderDist(urlPath) {
  const rel = urlPath.replace(/^\/+/, "").replace(/\/+$/, "");
  const segments = rel.split("/").filter(Boolean);
  if (unsafeSegments(segments)) return null;
  let disk = path.join(root, ...segments);

  if (urlPath.endsWith("/")) {
    const idx = path.join(disk, "index.html");
    return fs.existsSync(idx) && fs.statSync(idx).isFile() ? idx : null;
  }
  if (fs.existsSync(disk) && fs.statSync(disk).isFile()) return disk;
  const idx = path.join(disk, "index.html");
  if (fs.existsSync(idx) && fs.statSync(idx).isFile()) return idx;
  const html = disk + ".html";
  if (fs.existsSync(html) && fs.statSync(html).isFile()) return html;
  return null;
}

const hubPrefix = `/${segment}`;

const server = http.createServer((req, res) => {
  const raw = req.url || "/";
  const q = raw.indexOf("?");
  const pathname = q >= 0 ? raw.slice(0, q) : raw;

  if (pathname === "/" || pathname === "") {
    res.writeHead(302, { Location: `${hubPrefix}/` });
    res.end();
    return;
  }

  const filePath = resolveUnderDist(pathname);
  if (!filePath || !filePath.startsWith(path.resolve(root))) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`404 Not Found\nPath: ${pathname}\nHint: http://localhost:${port}${hubPrefix}/`);
    return;
  }

  const ext = path.extname(filePath);
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  res.end(fs.readFileSync(filePath));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[hub-static-preview] segment=${segment} root=${root}`);
  console.log(`[hub-static-preview] http://localhost:${port}${hubPrefix}/`);
});

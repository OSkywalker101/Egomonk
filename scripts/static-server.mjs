/**
 * Minimal zero-dependency static server for the exported site in `out/`.
 *
 * `next start` cannot serve a static export, so this exists purely to preview
 * the exact files a host would receive. Usage: node scripts/static-server.mjs [port]
 */
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join, extname, normalize, resolve } from "node:path";

const ROOT = resolve(process.cwd(), "out");
const PORT = Number(process.argv[2]) || 4173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
};

async function resolveFile(urlPath) {
  // Strip the query/hash and normalise away any ../ traversal attempts.
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const safe = normalize(clean).replace(/^(\.\.[/\\])+/, "");
  let target = join(ROOT, safe);
  if (!target.startsWith(ROOT)) return null;

  try {
    const info = await stat(target);
    if (info.isDirectory()) {
      target = join(target, "index.html");
      await stat(target);
    }
  } catch {
    // Extensionless path: try /path.html then /path/index.html
    for (const candidate of [`${target}.html`, join(target, "index.html")]) {
      try {
        await stat(candidate);
        return candidate;
      } catch {
        /* keep trying */
      }
    }
    return null;
  }
  return target;
}

const server = createServer(async (req, res) => {
  const file = await resolveFile(req.url || "/");
  if (!file) {
    const notFound = join(ROOT, "404.html");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    createReadStream(notFound).on("error", () => res.end("404")).pipe(res);
    return;
  }
  res.writeHead(200, {
    "Content-Type": TYPES[extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`[static] serving ${ROOT} on http://localhost:${PORT}`);
});

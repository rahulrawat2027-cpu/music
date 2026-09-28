import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";

const ROOT = resolve(process.cwd());
const PORT = Number(process.env.PORT || 3000);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".txt": "text/plain; charset=utf-8",
};

async function resolveFile(urlPath) {
  let rel = decodeURIComponent(urlPath.split("?")[0]);
  if (rel.endsWith("/")) rel += "index.html";
  const candidates = [];

  if (rel === "/" || rel === "/index.html") {
    candidates.push("index (5).html", "index.html");
  }

  const safe = normalize(rel).replace(/^(\.\.[/\\])+/, "");
  candidates.push(safe);

  for (const candidate of candidates) {
    const abs = join(ROOT, candidate);
    if (!abs.startsWith(ROOT + sep) && abs !== ROOT) continue;
    try {
      const info = await stat(abs);
      if (info.isFile()) return abs;
    } catch {
      /* keep looking */
    }
  }
  return null;
}

const server = createServer(async (req, res) => {
  const file = await resolveFile(req.url || "/");
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": TYPES[extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(body);
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Server error");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serving ${ROOT} on http://0.0.0.0:${PORT}`);
});

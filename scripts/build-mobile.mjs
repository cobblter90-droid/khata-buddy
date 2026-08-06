// Generates the static SPA shell for the Capacitor Android build.
// The Vite/Nitro build output location differs by preset (.output/public for the
// cloudflare-module/nitro preset, dist/client for the plain client build), so we
// detect it, write the shell there, and mirror everything into .output/public,
// which is what capacitor.config.ts uses as webDir.
import {
  writeFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  mkdirSync,
  cpSync,
} from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const WEB_DIR = resolve(root, ".output/public");

const clientCandidates = [".output/public", "dist/client"].map((p) => resolve(root, p));
const clientDir = clientCandidates.find((dir) => existsSync(resolve(dir, "assets")));

if (!clientDir) {
  throw new Error(
    `Could not find built client assets in any of: ${clientCandidates.join(", ")}. Run \`vite build\` first.`,
  );
}
const assetsDir = resolve(clientDir, "assets");

const serverEntry = [".output/server/index.mjs", "dist/server/index.mjs"]
  .map((p) => resolve(root, p))
  .find((p) => existsSync(p));

async function renderWithServer() {
  if (!serverEntry) {
    throw new Error("No built server entry found");
  }
  const mod = await import(pathToFileURL(serverEntry).toString());
  const app = mod.default;
  if (!app || typeof app.fetch !== "function") {
    throw new Error("Server entry does not export a fetch handler");
  }
  const res = await app.fetch(new Request("http://localhost/"), {}, {
    waitUntil() {},
    passThroughOnException() {},
  });
  if (!res.ok) {
    throw new Error(`Shell render failed with status ${res.status}`);
  }
  const html = await res.text();
  if (!html.includes("<html")) {
    throw new Error("Shell render did not produce an HTML document");
  }
  return html;
}

function buildFallbackShell() {
  const files = readdirSync(assetsDir);
  // The client entry chunk is the one that boots the router (emitted as index-*.js).
  const entry =
    files.find((f) => /^index-[\w-]+\.js$/.test(f)) ??
    files.find((f) => /^client-[\w-]+\.js$/.test(f));
  if (!entry) {
    throw new Error(
      `Could not find a client entry chunk in ${assetsDir}. Files: ${files.join(", ")}`,
    );
  }
  const css = files.filter((f) => f.endsWith(".css"));
  const cssLinks = css.map((f) => `<link rel="stylesheet" href="/assets/${f}">`).join("");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"><meta name="theme-color" content="#22262E"><title>Assan Khata</title><link rel="icon" href="/favicon.png" type="image/png">${cssLinks}</head><body><div id="app"></div><script type="module" src="/assets/${entry}"></script></body></html>`;
}

let html;
let source = "ssr";
try {
  html = await renderWithServer();
} catch (error) {
  source = "fallback";
  console.warn(
    `[build-mobile] SSR shell render failed (${error.message}); using static fallback shell.`,
  );
  html = buildFallbackShell();
}

for (const file of ["index.html", "200.html"]) {
  writeFileSync(resolve(clientDir, file), html);
}

// Mirror into webDir (.output/public) when the build landed somewhere else.
if (clientDir !== WEB_DIR) {
  mkdirSync(WEB_DIR, { recursive: true });
  cpSync(clientDir, WEB_DIR, { recursive: true });
}

// Sanity check: the shell must reference at least one built script.
const written = readFileSync(resolve(WEB_DIR, "index.html"), "utf8");
if (!/src="\/assets\/[^"]+\.js"/.test(written)) {
  throw new Error("Generated shell does not reference a built client script");
}

console.log(
  `Wrote SPA shell (${html.length} bytes, source: ${source}) from ${clientDir} to .output/public/index.html and 200.html`,
);

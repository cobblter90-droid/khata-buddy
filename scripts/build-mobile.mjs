// Generates the static SPA shell for the Capacitor Android build.
// Runs after `vite build`: preferred path boots the built server entry in-process
// and renders the shell HTML. If that fails for any reason (missing env vars in CI,
// SSR-only crash, etc.) we fall back to composing a minimal shell from the built
// client assets, so the mobile build never depends on a working SSR render.
import { writeFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const serverEntry = resolve(root, "dist/server/index.mjs");
const clientDir = resolve(root, "dist/client");
const assetsDir = resolve(clientDir, "assets");

if (!existsSync(assetsDir)) {
  throw new Error(`Missing ${assetsDir}. Run \`vite build\` first.`);
}

async function renderWithServer() {
  if (!existsSync(serverEntry)) {
    throw new Error(`Missing ${serverEntry}`);
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
  console.warn(`[build-mobile] SSR shell render failed (${error.message}); using static fallback shell.`);
  html = buildFallbackShell();
}

for (const file of ["index.html", "200.html"]) {
  writeFileSync(resolve(clientDir, file), html);
}

// Sanity check: the shell must reference at least one built script.
const written = readFileSync(resolve(clientDir, "index.html"), "utf8");
if (!/src="\/assets\/[^"]+\.js"/.test(written)) {
  throw new Error("Generated shell does not reference a built client script");
}

console.log(
  `Wrote SPA shell (${html.length} bytes, source: ${source}) to dist/client/index.html and 200.html`,
);

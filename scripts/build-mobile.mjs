// Generates the static SPA shell for the Capacitor Android build.
// Runs after `MOBILE=1 vite build`: boots the built server entry in-process,
// renders the SPA shell HTML and writes it into the client output (webDir).
import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const serverEntry = resolve(root, "dist/server/index.mjs");
const clientDir = resolve(root, "dist/client");

if (!existsSync(serverEntry)) {
  throw new Error(`Missing ${serverEntry}. Run \`MOBILE=1 vite build\` first.`);
}

const app = (await import(pathToFileURL(serverEntry).toString())).default;
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

for (const file of ["index.html", "200.html"]) {
  writeFileSync(resolve(clientDir, file), html);
}

console.log(`Wrote SPA shell (${html.length} bytes) to dist/client/index.html and 200.html`);
process.exit(0);

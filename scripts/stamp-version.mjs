/**
 * Stamps versionName / versionCode from APP_VERSION in src/lib/constants.ts,
 * the single source of truth for the app version.
 *
 * Run from the repo root: node scripts/stamp-version.mjs
 */
import fs from "node:fs";

const constants = fs.readFileSync("src/lib/constants.ts", "utf8");
const match = /APP_VERSION\s*=\s*["']([^"']+)["']/.exec(constants);
if (!match) {
  console.error("::error::APP_VERSION not found in src/lib/constants.ts");
  process.exit(1);
}

const version = match[1];
const [major = 0, minor = 0, patch = 0] = version.split(".").map((n) => parseInt(n, 10) || 0);
const versionCode = major * 10000 + minor * 100 + patch;

const gradlePath = "android/app/build.gradle";
let gradle = fs.readFileSync(gradlePath, "utf8");
gradle = gradle.replace(/versionName ".*"/, `versionName "${version}"`);
gradle = gradle.replace(/versionCode [0-9]+/, `versionCode ${versionCode}`);
fs.writeFileSync(gradlePath, gradle);

console.log(`APP_VERSION = ${version}`);
console.log(`versionCode = ${versionCode}`);

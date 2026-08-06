/**
 * Declares the contacts permissions the Capacitor contacts plugin requires.
 *
 * The plugin's permission API refuses to run unless BOTH READ_CONTACTS and
 * WRITE_CONTACTS are declared in the merged manifest — that is the exact cause
 * of the "Missing the following permissions in AndroidManifest.xml:
 * android.permission.WRITE_CONTACTS" error seen on device. The app only ever
 * reads a contact (system picker + optional list read); it never writes to the
 * phone book, but the declaration is mandatory for the plugin to load.
 *
 * Run from the repo root: node scripts/ensure-android-permissions.mjs
 */
import fs from "node:fs";

const manifestPath = "android/app/src/main/AndroidManifest.xml";
let manifest = fs.readFileSync(manifestPath, "utf8");

const permissions = ["android.permission.READ_CONTACTS", "android.permission.WRITE_CONTACTS"];

for (const permission of permissions) {
  if (manifest.includes(permission)) continue;
  manifest = manifest.replace(
    "</manifest>",
    `    <uses-permission android:name="${permission}" />\n</manifest>`,
  );
}

fs.writeFileSync(manifestPath, manifest);

for (const permission of permissions) {
  if (!manifest.includes(permission)) {
    console.error(`::error::${permission} missing from ${manifestPath}`);
    process.exit(1);
  }
  console.log(`declared: ${permission}`);
}

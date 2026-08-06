/**
 * Pins the Android debug signingConfig to the committed keystore, so every CI
 * build signs with the same certificate and a new APK installs over the old
 * one without an uninstall.
 *
 * Run from the repo root: node scripts/pin-debug-keystore.mjs
 */
import fs from "node:fs";

const gradlePath = "android/app/build.gradle";
let gradle = fs.readFileSync(gradlePath, "utf8");

if (!gradle.includes("assanDebugKeystore")) {
  const signingConfigs = [
    "    signingConfigs {",
    "        debug {",
    "            // assanDebugKeystore: stable committed key — do not regenerate",
    "            storeFile file('debug.keystore')",
    "            storePassword 'android'",
    "            keyAlias 'androiddebugkey'",
    "            keyPassword 'android'",
    "        }",
    "    }",
    "",
  ].join("\n");

  gradle = gradle.replace(/android\s*\{/, (match) => `${match}\n${signingConfigs}`);
  gradle = gradle.replace(
    /buildTypes\s*\{\s*/,
    (match) => `${match}\n        debug {\n            signingConfig signingConfigs.debug\n        }\n`,
  );
  fs.writeFileSync(gradlePath, gradle);
}

console.log(gradle);

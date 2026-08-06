import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.urdevelopers.assankhata",
  appName: "Assan Khata",
  // Must match the static web output produced by `npm run build:mobile`.
  webDir: ".output/public",
  android: {
    allowMixedContent: false,
  },
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false,
    },
    Keyboard: {
      // Resize the WebView body instead of the whole viewport: without this
      // some OEM keyboards push the entire screen up when a field is focused.
      resize: "body",
      resizeOnFullScreen: true,
    },

  },
};

export default config;

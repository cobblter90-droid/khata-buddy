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
      // "native" lets Android's own windowSoftInputMode resize the WebView.
      // "body" resized the document instead, which made 100vh layouts on some
      // OEM builds jump upward and leave a blank strip when a field focused.
      resize: "native",
      resizeOnFullScreen: true,
    },
  },

};

export default config;

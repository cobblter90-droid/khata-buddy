import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.urdevelopers.assankhata",
  appName: "Assan Khata",
  // Must match the static web output produced by `npm run build:mobile`.
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false,
    },
  },
};

export default config;

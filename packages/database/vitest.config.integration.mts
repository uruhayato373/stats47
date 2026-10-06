import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: "./wrangler.toml",
      },
    }),
  ],
  test: {
    alias: {
      "server-only": path.resolve(import.meta.dirname, "./src/testing/server-only-mock.ts"),
    },
  },
});

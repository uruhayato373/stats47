import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import path from "path";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: {
          configPath: "./wrangler.toml",
        },
      },
    },
    alias: {
      "server-only": path.resolve(__dirname, "./src/testing/server-only-mock.ts"),
    },
  },
});

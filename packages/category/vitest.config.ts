import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // Add environment to be explicit
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["**/*.integration.test.ts", "**/integration.test.ts"],
  },
});

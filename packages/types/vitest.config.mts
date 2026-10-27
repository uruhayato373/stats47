import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@stats47/types",
    globals: true,
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});

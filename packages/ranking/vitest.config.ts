import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@stats47/ranking",
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});

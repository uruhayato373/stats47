import { fileURLToPath } from 'node:url';
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { '@stats47/types': fileURLToPath(new URL('../types/src/index.ts', import.meta.url)) } },
  test: {
    name: "@stats47/ranking",
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});

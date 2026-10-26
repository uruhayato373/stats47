import { defineConfig } from "vitest/config";

/** migration-flow の純関数テスト (React 部品は対象外)。 */
export default defineConfig({
  test: {
    name: "@stats47/migration-flow",
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});

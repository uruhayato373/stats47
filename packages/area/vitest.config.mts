import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // vitest のテストは src だけ。mirror/__tests__ は node:test で書いてあり (素の node で動く鏡の検査)、
    // 走らせる口は npm run test:claude-lib-contracts。既定の対象のままだと vitest が拾って落ちる。
    include: ["src/**/*.test.ts"],
  },
});

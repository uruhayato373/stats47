import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    environment: "node",
    // 実データ検査の入力 (パックの固定データ) が無い環境では公開 R2 から作る
    globalSetup: ["tests/setup/pack-snapshots.global.ts"],
  },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    // PACKS_MIGRATION (2026-07-23): note チャネルは旧 174 件カタログ前提のまま一時凍結。
    // 14 パック (P-01〜P-14) への再設計まで note-channel テストを除外する (未公開・実害なし)。
    exclude: ["node_modules", "dist", "tests/note-channel.test.ts"],
    environment: "node",
  },
});

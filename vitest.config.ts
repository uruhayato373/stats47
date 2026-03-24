import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.open-next/**",
      "**/coverage/**",
      // 手動実行専用テストを除外（NEXT_PUBLIC_ESTAT_APP_ID が必要）
      "**/*manual-download*",
    ],
  },
});

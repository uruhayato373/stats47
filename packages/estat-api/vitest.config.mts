import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: [path.resolve(__dirname, "./test-utils/setup.ts")],
    // 手動実行専用テストを除外（NEXT_PUBLIC_ESTAT_APP_ID が必要）
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/*manual-download*",
    ],
  },
  resolve: {
    alias: [
      { find: "server-only", replacement: path.resolve(__dirname, "./test-utils/server-only-mock.js") },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
});

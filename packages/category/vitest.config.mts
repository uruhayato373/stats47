import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // Add environment to be explicit
    setupFiles: ["./vitest.setup.ts"],
    // このパッケージは現時点でテストを持たない。workspace には登録したままにして
    // (テストを足したら自動で拾われる)、0 件を失敗にしない。
    passWithNoTests: true,
    // ★configDefaults.exclude を展開しないと node_modules の既定除外ごと上書きされ、
    //   依存パッケージ (zod) 自身のテストまで収集して collection error になる (2026-07-31 是正)。
    exclude: [...configDefaults.exclude, "**/*.integration.test.ts", "**/integration.test.ts"],
  },
});

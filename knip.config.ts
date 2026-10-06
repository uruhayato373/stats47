import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    "apps/web": {
      entry: [
        // Next.js App Router の規約ファイル (Next が動的に呼ぶ = entry)
        "src/app/**/{error,global-error,layout,loading,not-found,page,template,route,default}.{js,jsx,ts,tsx}!",
        // Next.js メタデータ規約ファイル (sitemap/robots/manifest/各種 image)
        "src/app/**/{sitemap,robots,manifest,opengraph-image,twitter-image,icon,apple-icon}.{js,jsx,ts,tsx}!",
        // middleware / テストセットアップ (vitest.config の setupFiles)
        "src/middleware.{ts,tsx}!",
        "src/config/test.setup.tsx!",
        "scripts/**/*.{ts,tsx}!",
        "*.config.{js,cjs,mjs,ts}!",
      ],
      project: ["src/**/*.{ts,tsx}", "scripts/**/*.{ts,tsx}", "*.{ts,mjs}"],
      ignore: ["**/__tests__/**", "**/*.test.{ts,tsx}", "vitest.shims.{ts,d.ts}"],
    },
    "packages/*": {
      entry: "src/index.{ts,tsx}!",
      project: ["src/**/*.{ts,tsx}"],
      ignore: ["**/__tests__/**", "**/*.test.{ts,tsx}"],
    },
    // vitest.config.integration.ts は @cloudflare/vitest-pool-workers 0.22 で消えた
    // "./config" を import しており読み込めない。knip 6 は対象外の workspace でも
    // test:integration script 経由でこの設定を読んで exit 2 になるため、vitest
    // プラグインを止める (副作用: alias 専用の src/testing/server-only-mock.ts が未使用扱い)。
    "packages/database": {
      entry: "src/index.{ts,tsx}!",
      project: ["src/**/*.{ts,tsx}"],
      ignore: ["**/__tests__/**", "**/*.test.{ts,tsx}"],
      vitest: false,
    }
  },
  ignoreDependencies: [
    "@expo-google-fonts/noto-sans-jp",
    "@types/*",
    "eslint-config-next",
    "prettier",
    "topojson-specification",
    "turbo"
  ],
  ignoreBinaries: ["react-server"]
};

export default config;

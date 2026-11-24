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
    // package.json の exports / main は knip が自動で入口に足す。ここで足すのは、exports を通らずに
    // 直接実行される CLI (scripts・src/**/scripts)・mirror (.claude/scripts が相対パスで読む)・テスト。
    // .mjs / .cjs / .mts を project に含めないと、そこでだけ使う依存を「未使用」と誤判定する (2026-11-21 実測:
    // r2-storage の https-proxy-agent、ops の @stats47/estat-api など)。
    "packages/*": {
      entry: [
        "src/index.{ts,tsx}!",
        "{scripts,src/**/scripts}/**/*.{ts,mts,mjs,cjs}",
        "mirror/**/*.{mjs,cjs}",
        "src/**/__tests__/**/*.{ts,tsx,mts,mjs,cjs}",
        "{src,tests}/**/*.test.{ts,tsx,mts,mjs,cjs}",
        "*.config.{ts,mts,mjs,cjs}",
      ],
      project: ["src/**/*.{ts,tsx,mts,mjs,cjs}", "scripts/**/*.{ts,mts,mjs,cjs}", "mirror/**/*.{mjs,cjs}", "tests/**/*.{ts,tsx}"],
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

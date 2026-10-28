import type { Config } from "tailwindcss";

const coconalaFontFamily = [
  "Hiragino Kaku Gothic ProN",
  "Hiragino Kaku Gothic Pro",
  "Meiryo",
  "Helvetica Neue",
  "Helvetica",
  "Arial",
  "sans-serif",
];

const config: Config = {
  darkMode: ["class"],
  content: [
    // src/lib などにもクラス文字列がある (BLOG_THUMBNAIL_ASPECT_CLASS・CookieConsentBanner)。
    // v3 ではほかのファイルに同じクラスがあったため偶然生成されていた
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/components/src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/visualization/src/**/*.{js,ts,jsx,tsx,mdx}",
    // どこからも import されない atom は走査しない (index.ts の export * には残る。2026-10-28 配信サイズの点検)。
    // 一覧は scripts/ui-theme/inline-lyra.mjs の UNUSED_ATOMS と同じ (テストが一致と importer 0 件を確かめる)。
    // base.css の `@source not` は Tailwind 4.3.3 でこの content を外せなかったので、除外はここに書く。
    "!../../packages/components/src/atoms/ui/accordion.tsx",
    "!../../packages/components/src/atoms/ui/alert.tsx",
    "!../../packages/components/src/atoms/ui/alert-dialog.tsx",
    "!../../packages/components/src/atoms/ui/dialog.tsx",
    "!../../packages/components/src/atoms/ui/progress.tsx",
    "!../../packages/components/src/atoms/ui/switch.tsx",
    "!../../packages/components/src/atoms/ui/textarea.tsx",
  ],
  // safelist (col-span-N の動的生成)・コンテナクエリ幅 (@sm 30rem / @md 48rem / @lg 64rem)・
  // container ユーティリティ (中央寄せ・2xl で最大 1700px) は v4 の JS 設定では効かないため
  // src/app/globals.css 側で定義する
  theme: {
    extend: {
      fontFamily: {
        sans: coconalaFontFamily,
        mono: coconalaFontFamily,
      },
      // 色と角丸 (bg-card / rounded-card / text-positive …) は @stats47/ui-theme/theme.css の @theme が持つ (管理画面・動画アプリと共有)
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;

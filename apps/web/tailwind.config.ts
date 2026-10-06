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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          // 完全な色値 (transparent を取れるよう hsl で包まない)。opacity 修飾子は使わない
          outline: "var(--card-outline)",
        },
        // データの状態色。生の emerald/red/amber/blue-NNN の代わりに使う
        positive: { DEFAULT: "hsl(var(--positive))", soft: "hsl(var(--positive-soft))" },
        negative: { DEFAULT: "hsl(var(--negative))", soft: "hsl(var(--negative-soft))" },
        warning: { DEFAULT: "hsl(var(--warning))", soft: "hsl(var(--warning-soft))" },
        info: { DEFAULT: "hsl(var(--info))", soft: "hsl(var(--info-soft))" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "var(--card-radius)",
        // 本文の中に置く部品 (callout・本文内カード・コードブロック)。レイアウトのカード外枠とは別の役割
        content: "var(--content-radius)",
      },
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

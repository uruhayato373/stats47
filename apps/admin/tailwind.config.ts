import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/components/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ★値は globals.css の CSS 変数を参照する (hex 直書きに戻さない)。
        // 直書きだと light/dark の切替が効かず、チャンネル形式 + <alpha-value> で
        // ないと bg-console-bg/95 のような透過指定が壊れる。
        console: {
          bg: "rgb(var(--console-bg) / <alpha-value>)",
          card: "rgb(var(--console-card) / <alpha-value>)",
          border: "rgb(var(--console-border) / <alpha-value>)",
          fg: "rgb(var(--console-fg) / <alpha-value>)",
          muted: "rgb(var(--console-muted) / <alpha-value>)",
          accent: "rgb(var(--console-accent) / <alpha-value>)",
          good: "rgb(var(--console-good) / <alpha-value>)",
          warn: "rgb(var(--console-warn) / <alpha-value>)",
          info: "rgb(var(--console-info) / <alpha-value>)",
          bad: "rgb(var(--console-bad) / <alpha-value>)",
          neutral: "rgb(var(--console-neutral) / <alpha-value>)",
        },
        // shadcn トークン (@stats47/components の Button/Badge/Card/Dialog 用)。
        // 値は globals.css の CSS 変数 (console パレットへマッピング済み) を参照する。
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
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;

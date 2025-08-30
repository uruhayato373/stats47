import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./.storybook/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class", // クラスベースのダークモード
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // カスタムカラーの追加
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },
      },
      backgroundColor: {
        // ダークモード用の背景色
        "dark-primary": "#0a0a0a",
        "dark-secondary": "#171717",
        "dark-tertiary": "#262626",
      },
      textColor: {
        // ダークモード用のテキスト色
        "dark-primary": "#ededed",
        "dark-secondary": "#d4d4d4",
        "dark-tertiary": "#a3a3a3",
      },
      borderColor: {
        // ダークモード用のボーダー色
        "dark-primary": "#404040",
        "dark-secondary": "#525252",
      },
    },
  },
  plugins: [],
};

export default config;

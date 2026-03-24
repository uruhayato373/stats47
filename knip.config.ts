import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    "apps/web": {
      entry: "src/app/**/{error,layout,loading,not-found,page,template,route}.{js,jsx,ts,tsx}!",
      project: ["src/**/*.{ts,tsx}"],
      ignore: ["**/__tests__/**", "**/*.test.{ts,tsx}"],
    },
    "packages/*": {
      entry: "src/index.{ts,tsx}!",
      project: ["src/**/*.{ts,tsx}"],
      ignore: ["**/__tests__/**", "**/*.test.{ts,tsx}"],
    }
  },
  ignoreDependencies: [
    "@types/*",
    "eslint-config-next",
    "prettier",
    "turbo"
  ]
};

export default config;

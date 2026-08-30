import nextPlugin from "@next/eslint-plugin-next";
import nextTypescript from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

const typescriptParser = nextTypescript.find(
  (config) => config.languageOptions?.parser,
)?.languageOptions?.parser;

if (!typescriptParser) {
  throw new Error("eslint-config-next/typescript did not expose a parser");
}

const eslintConfig = [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { sourceType: "module" },
    },
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "no-console": "warn",
      "no-duplicate-imports": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}"],
    rules: { "no-console": "off" },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".local/**",
      "out/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;

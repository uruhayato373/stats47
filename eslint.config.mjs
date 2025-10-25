// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";
import importPlugin from "eslint-plugin-import";
import storybook from "eslint-plugin-storybook";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "react/no-unescaped-entities": "warn",
      "storybook/no-renderer-packages": "warn",
      "import/order": [
        "error",
        {
          groups: [
            "builtin", // Node.js組み込みモジュール
            "external", // 外部ライブラリ
            "internal", // @/で始まる内部モジュール
            "parent", // ../
            "sibling", // ./
            "index", // ./index
            "type", // type import
          ],
          pathGroups: [
            {
              pattern: "react",
              group: "external",
              position: "before",
            },
            {
              pattern: "next/**",
              group: "external",
              position: "before",
            },
            {
              pattern: "@/components/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/features/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/lib/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/hooks/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/types/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/store/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/config/**",
              group: "internal",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["react", "next"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  {
    files: ["**/*.stories.ts", "**/*.stories.tsx"],
    rules: {
      "storybook/no-renderer-packages": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-var-requires": "off",
    },
  },
  ...storybook.configs["flat/recommended"],
];

export default eslintConfig;

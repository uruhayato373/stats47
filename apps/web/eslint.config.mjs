// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format

import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";
import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [// TypeScript Configuration
// React Configuration
{
  files: ["**/*.ts", "**/*.tsx"],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  plugins: {
    "@typescript-eslint": tsPlugin,
  },
  rules: {
    ...tsPlugin.configs.recommended.rules,
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-empty-object-type": "warn",
  },
}, reactPlugin.configs.flat.recommended, // React Hooks Configuration
reactPlugin.configs.flat["jsx-runtime"], // Next.js Configuration
reactHooksPlugin.configs.flat.recommended, {
  plugins: {
    "@next/next": nextPlugin,
  },
  rules: {
    ...nextPlugin.configs.recommended.rules,
    ...nextPlugin.configs["core-web-vitals"].rules,
  }
}, {
  ignores: [
    "node_modules/**",
    ".next/**",
    ".open-next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ],
}, {
  settings: {
    react: {
      version: "detect",
    },
  },
  plugins: {
    import: importPlugin,
  },
  rules: {
    "react/no-unescaped-entities": "warn",
    "no-console": "error",
    "no-duplicate-imports": "error",
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: [
              "@/features/*/components/*",
              "@/features/*/lib/*",
              "@/features/*/utils/*",
              "@/features/*/repositories/*",
              "@/features/*/services/*",
            ],
            message:
              "内部実装への直接アクセスは禁止です。Public API(@/features/*)からインポートしてください。",
          },
          {
            group: ["@/features/auth/lib/auth", "@/features/auth/utils/admin"],
            message: "代わりに '@/features/auth' からインポートしてください。",
          },
          {
            group: ["@/features/database/d1", "@/features/database/d1-remote"],
            message: "代わりに '@/features/database' からインポートしてください。",
          },
          {
            group: ["@/features/category/repositories/*"],
            message: "代わりに '@/features/category' からインポートしてください。",
          },
          {
            group: ["@/features/r2-storage/lib/*"],
            message: "代わりに '@/features/r2-storage' からインポートしてください。",
          },
          {
            "group": [
              "@/features/area/types/*",
              "@/features/area/components/*",
              "@/features/area/hooks/*",
              "@/features/area/utils/*",
              "@/features/area/repositories/*",
              "@/features/area/services/*",
            ],
            "message": "代わりに '@/features/area' からインポートしてください。",
          },
                    {
                      "group": ["@/features/visualization/d3/utils"],
                      "message": "Deep imports from '@/features/visualization/d3/utils' are disallowed. Please import from the public API: '@/features/visualization/d3'."
                    },
                    {
                      "group": ["@/features/visualization/d3/*/*"],
                      "message": "Deep imports from '@/features/visualization/d3' are disallowed. Please import from the public API: '@/features/visualization/d3'."
                    },
                    {
                      "group": ["@/features/visualization/d3/components"],
                      "message": "Deep imports from '@/features/visualization/d3/components' are disallowed. Please import from the public API: '@/features/visualization/d3'."
                    },
                    {
                      "group": ["@/features/visualization/d3/constants"],
                      "message": "Deep imports from '@/features/visualization/d3/constants' are disallowed. Please import from the public API: '@/features/visualization/d3'."
                    },
                    {
                      "group": ["@/features/visualization/d3/hooks"],
                      "message": "Deep imports from '@/features/visualization/d3/hooks' are disallowed. Please import from the public API: '@/features/visualization/d3'."
                    },
                    {
                      "group": ["@/features/visualization/d3/types"],
                      "message": "Deep imports from '@/features/visualization/d3/types' are disallowed. Please import from the public API: '@/features/visualization/d3'."
                    },
                    {
                      "group": ["@/features/visualization/d3/utils"],
                      "message": "Deep imports from '@/features/visualization/d3/utils' are disallowed. Please import from the public API: '@/features/visualization/d3'."
                    },
          // @stats47/visualization パッケージ: 公開 API 以外の深いインポート禁止
                    {
                      group: ["@stats47/visualization/d3/*", "@stats47/visualization/d3/*/*"],
                      message: "@stats47/visualization/d3 から直接インポートしてください",
                    },
                    {
                      group: ["@stats47/visualization/shared", "@stats47/visualization/shared/*"],
                      message: "shared は内部モジュールです。@stats47/visualization/d3 を使用してください",
                    },
                    {
                      group: ["@stats47/visualization/src", "@stats47/visualization/src/*"],
                      message: "src への直接アクセスは禁止です",
                    },
        ],
      },
    ],
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
}, // 各機能内部では内部実装にアクセス可
{
  files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-var-requires": "off",
    "no-console": "off", // テストファイルではconsole.*を許可
    "no-restricted-imports": "off", // テストファイルでは内部実装へのアクセスを許可
  },
}, {
  files: [
    "src/features/auth/**/*.ts",
    "src/features/auth/**/*.tsx",
    "src/features/database/**/*.ts",
    "src/features/database/**/*.tsx",
    "src/features/category/**/*.ts",
    "src/features/category/**/*.tsx",
    "src/features/r2-storage/**/*.ts",
    "src/features/r2-storage/**/*.tsx",
    "src/features/area/**/*.ts",
    "src/features/area/**/*.tsx",
  ],
  rules: {
    "no-restricted-imports": "off",
  },
}, // ドメイン内Barrel File経由インポート強制
{
  files: [
    "src/features/*/types/**/*.ts",
    "src/features/*/types/**/*.tsx",
    "src/features/*/utils/**/*.ts",
    "src/features/*/utils/**/*.tsx",
    "src/features/*/hooks/**/*.ts",
    "src/features/*/hooks/**/*.tsx",
    "src/features/*/components/**/*.ts",
    "src/features/*/components/**/*.tsx",
    "src/features/*/services/**/*.ts",
    "src/features/*/services/**/*.tsx",
    "src/features/*/actions/**/*.ts",
    "src/features/*/actions/**/*.tsx",
  ],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["../types/*"],
            message: "ドメイン内の型はBarrel File経由でインポートしてください。'../types' からインポートしてください。",
          },
          {
            group: ["../utils/*"],
            message: "ドメイン内のユーティリティはBarrel File経由でインポートしてください。'../utils' からインポートしてください。",
          },
          {
            group: ["../hooks/*"],
            message: "ドメイン内のフックはBarrel File経由でインポートしてください。'../hooks' からインポートしてください。",
          },
          {
            group: ["../components/*"],
            message: "ドメイン内のコンポーネントはBarrel File経由でインポートしてください。'../components' からインポートしてください。",
          },
          {
            group: ["../services/*"],
            message: "ドメイン内のサービスはBarrel File経由でインポートしてください。'../services' からインポートしてください。",
          },
          {
            group: ["../actions/*"],
            message: "ドメイン内のアクションはBarrel File経由でインポートしてください。'../actions' からインポートしてください。",
          },
        ],
      },
    ],
  },
}, {
  files: ["**/__mocks__/**", "**/__debug__/**", "**/scripts/**"],
  rules: {
    "no-console": "off", // モックファイル、デバッグファイル、スクリプトではconsole.*を許可
  },
}, {
  // クライアントコンポーネントでlookupCategoryIconを使用する場合の例外
  // @/features/categoryからインポートするとサーバー専用モジュールがバンドルされてしまうため
  files: ["**/AppSidebarContent.tsx"],
  rules: {
    "no-restricted-imports": "off",
  },
}, ...storybook.configs["flat/recommended"]];

export default eslintConfig;

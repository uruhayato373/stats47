import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const FEATURE_INTERNAL_IMPORT_PATTERNS = [
  {
    group: [
      "@/features/*/components/*",
      "@/features/*/lib/*",
      "@/features/*/utils/*",
      "@/features/*/repositories/*",
      "@/features/*/services/*",
    ],
    message: "他 feature の内部実装ではなく Public API (index.ts / server.ts) を使用してください。",
  },
];

// サイト内リンクは SiteLink 経由 (表示時の先読みをやめ、触れたときだけ先読みする)。
// feature 向けの上書き設定も同じ定数を使う (上書きは規則を丸ごと置き換えるため)。
const RESTRICTED_IMPORT_PATHS = [
  {
    name: "next/link",
    message:
      "@/components/atoms/SiteLink を使ってください (表示時の先読みが _rsc の毎回描画で Workers CPU を使うため)。",
  },
];

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
    "react/prop-types": "off",
    "no-console": "error",
    "no-duplicate-imports": "error",
    "no-restricted-imports": [
      "error",
      {
        paths: RESTRICTED_IMPORT_PATHS,
        patterns: [
          // feature 内部実装への直接アクセス禁止（Public API 経由のみ）
          ...FEATURE_INTERNAL_IMPORT_PATTERNS,
          // @stats47/visualization: コンポーネント内部への直接アクセス禁止
          {
            group: [
              "@stats47/visualization/d3/*/*",
              "@stats47/visualization/shared",
              "@stats47/visualization/shared/*",
              "@stats47/visualization/src",
              "@stats47/visualization/src/*",
            ],
            message: "@stats47/visualization の Public API を使用してください。",
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
        paths: RESTRICTED_IMPORT_PATHS,
        patterns: [
          // 後勝ちの override でも feature 境界契約を失わない。
          ...FEATURE_INTERNAL_IMPORT_PATTERNS,
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
  // "use server" のファイルは async 関数だけを export する (Next.js のサーバーアクションの規則)。
  // 型の再 export (`export type { … } from`) で Turbopack の開発サーバーがテーマ詳細を 500 にした (2026-10-21・USE-SERVER-EXPORT-LINT-01)。
  // `export interface` / `export type X =` の宣言はコンパイル時に消えるので許す (再 export と値の export だけを止める)。
  files: ["**/*.ts", "**/*.tsx"],
  rules: {
    "no-restricted-syntax": [
      "error",
      ...[
        "ExportNamedDeclaration[source]",
        "ExportAllDeclaration",
        "ExportNamedDeclaration[declaration=null]:not([source])",
        "ExportNamedDeclaration > VariableDeclaration",
        "ExportNamedDeclaration > ClassDeclaration",
        "ExportNamedDeclaration > FunctionDeclaration[async=false]",
        "ExportDefaultDeclaration:not(:has(> FunctionDeclaration[async=true]))",
      ].map((selector) => ({
        selector: `Program:has(> ExpressionStatement[directive='use server']) > ${selector}`,
        message: '"use server" のファイルは async 関数だけを export する。型や値は別ファイルへ移す (USE-SERVER-EXPORT-LINT-01)',
      })),
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
}];

export default eslintConfig;

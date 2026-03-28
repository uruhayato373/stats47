# ESLint 9 Flat Config 移行時の注意点

**トリガー**: ESLint 9 で `no-restricted-imports` の `patterns` プロパティが `{group, message}` オブジェクト配列で動かない。
**対処**: `patterns` を文字列配列に変換（`"@/features/*/components/*"` 等）。`FlatCompat`（`@eslint/eslintrc`）は使わないなら import を削除（import するだけで ajv 初期化が走りクラッシュする）。`eslint-plugin-storybook` 等の未インストールプラグインの import も削除。重複エントリを除去。
**根拠**: ESLint 9 の flat config は旧 `.eslintrc` 形式と互換性がない。`FlatCompat` は互換レイヤーだが ajv 依存で壊れやすい。
**確信度**: 0.8
**発見日**: 2026-03-28
**関連**: `apps/web/eslint.config.mjs`

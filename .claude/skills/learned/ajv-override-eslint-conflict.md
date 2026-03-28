# ajv Override による ESLint 起動不能

**トリガー**: ESLint が `TypeError: Cannot set properties of undefined (setting 'defaultMeta')` でクラッシュする。
**対処**: root の `package.json` の `overrides.ajv` を削除し、`package-lock.json` を削除して `npm install` で再生成。`@eslint/eslintrc` が内部で ajv@6 を要求するが、override で ajv@8 に上書きされていた。
**根拠**: npm overrides はネスト依存にも適用される。ajv@6 と ajv@8 は API 非互換で、@eslint/eslintrc の内部コードが ajv@8 で壊れる。
**確信度**: 0.9
**発見日**: 2026-03-28
**関連**: `package.json` (overrides), `package-lock.json`

---
name: audit-theme-components
description: テーマダッシュボードの現状監査を実行する（コンポーネント共有状況・ギャップ・重複分析）。Use when user says "テーマ監査", "コンポーネント監査". page_components vs IndicatorSet ギャップ検出.
disable-model-invocation: true
argument-hint: "<theme-key> | --all"
allowed-tools: Read, Grep, Glob, Bash
primary_agent: theme-component-builder
---

# テーマ構成・データ監査

正典は `packages/data-configs/src/theme-catalog/`。現行21テーマ（気候を含む）の
`sections` が、指標グループ・図・埋込の章順を決める。旧財政市区町村URLは現行テーマに数えない。

```bash
npm run theme:quality:check
npm run theme:quality:test
node --import tsx packages/data-configs/scripts/validate-theme-catalog.ts
node --import tsx packages/data-configs/scripts/generate-theme-catalog.ts --check
node --import tsx packages/data-configs/scripts/generate-theme-dependency-mirror.ts --check
```

構造だけを確認する場合は `npm run theme:quality:check -- --offline --json /tmp/theme-structure.json`。
未公開のローカル値は `--staged-dir .local/r2` で明示する。公開監査と混同しない。

検査は章の参照切れ・配置漏れ・重複、登録/active、選定根拠、単年を推移と呼ぶ図、
共通年不足、有限値の県数、重複、単位、前回からの履歴/coverage退行を対象とする。
別の `theme-chart-live-audit.mjs` がrecipe・配信メタ・依存集合を検査する。
全国専用系列、GIS、財政専用画面と実画面の操作は表示監査で補う。

- 単年・沿岸県だけ・秘匿は、それだけで不具合と断定しない。欠測を0にしない。
- 同じ指標のカードと詳細図を重複表示せず、章の問いに必要な比較を残す。
- 最高/最低気温、給与月額/年収、就職率/就業率、人口等の分母は定義まで確認する。
- 本体UIは theme-ui-manager、指標選定は theme-designer、定義/取得は data-ingesterへ渡す。
- 結果は `.claude/state/themes/quality.json`。未完了策は既存backlogへ統合し、docsへレビュー全文を増やさない。

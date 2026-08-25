---
name: insert-theme-components
description: 設計済みチャートを ThemeCatalog TS へ反映し、生成・検証する
argument-hint: '<theme-key>'
disable-model-invocation: true
allowed-tools: Read, Edit, Bash
primary_agent: theme-component-builder
---

`/design-theme-charts` で設計したチャートをテーマページに反映する。

> テーマの SSOT は **`packages/data-configs/src/theme-catalog/<key>.ts`**。
> `page-components/theme/<key>.json` と IndicatorSet は生成物で手編集禁止。反映は **カタログ TS を編集 →
> `npm run generate:catalog` → `npm run validate:catalog` → `generate:catalog --check`** の順。
> 正典 = `.claude/rules/theme-catalog-standards.md`。

## SSOT の場所

| pageType           | ファイル                                                                  |
| ------------------ | ------------------------------------------------------------------------- |
| テーマ             | `packages/data-configs/src/theme-catalog/<theme-key>.ts`                  |
| area-category 共有 | `apps/web/scripts/data/page-components/area-category/<category-key>.json` |
| city-category      | `apps/web/scripts/data/page-components/city-category/<category-key>.json` |
| area               | `apps/web/scripts/data/page-components/area/<NN000>.json`                 |

テーマ以外の JSON は `PageComponent[]`。テーマ JSON は ThemeCatalog から生成する。

## ThemeCatalog chart の編集契約

```ts
{
  "componentKey": "<一意キー>",
  "componentType": "bar-chart | line-chart | kpi-card | composition-chart | ...",
  "title": "表示タイトル",
  "componentProps": { "...": "チャート固有 props (estatParams 等)" },
  "annotation": "系列断絶等、誤読防止に不可欠な場合だけ",
  "relatedRankingKeys": ["<active-ranking-key>"],
  "sourceName": "出典名 or null",
  "sourceLink": "https://... or null",
  "sortOrder": 0
}
```

汎用的なチャートの読み方を `description` に書かない。指標定義は ranking hub、chart 固有 caveat は
`annotation`、出典は `source*` に分離する。

FAQ は `componentType: "markdown-section"` とし、`componentProps` に
`displayMode: "faq"` と `### Q1: 質問` 形式の `markdown` を置く。生成器が構造化 `items` へ変換するため、
page-components JSON を手編集したり runtime 用の FAQ 配列を別管理したりしない。

## 設計原則

- **1 カタログ = 1 ページ**: `theme-catalog/<key>.ts` がそのテーマページの全コンポーネント。Theme JSON は生成物
- **再利用**: 他テーマでも使う場合、同じ componentKey + 同じ props を各 ThemeCatalog に宣言し generator で出力する
- **重複禁止**: 同一 ThemeCatalog 内で componentKey を重複させない
- **areas との共有**: テーマ用チャートを関連 area-category にも載せる場合、`area-category/<category-key>.json` にも追加
- **composition-chart**: 実行時に e-Stat を fetch する (旧 `component_data` D1 投入は不要・廃止)

## 手順

1. 対象 ThemeCatalog TS と metric config を読み、rankingKey・source・estatParams の実在を確認
2. 設計済み chart を `charts[]` に追加・修正。`sortOrder` で表示順を制御
3. 生成物を再生成:
   ```bash
   npm run generate:catalog --workspace=@stats47/data-configs
   ```
4. 契約・drift を検証:
   ```bash
   npm run validate:catalog --workspace=@stats47/data-configs
   npm run generate:catalog --workspace=@stats47/data-configs -- --check
   ```
5. 対象テストと web type-check を実行し、localhost で表示確認
6. R2 push・デプロイは明示指示がある場合だけ担当 agent へ渡す

## 関連

- 正典: `docs/01_技術設計/02_データアーキテクチャ.md`（page_components）
- 設計: `/design-theme-charts` / reader: `apps/web/src/features/stat-charts/services/page-components-snapshot.ts`
- 生成: `apps/web/scripts/export-page-components-snapshot.ts` / 検証: `apps/web/scripts/verify-page-components-snapshot.ts`

---
name: insert-theme-components
description: 設計済みチャートをテーマページに反映 — git TS SSOT (page_components JSON) を編集して R2 生成
argument-hint: "<theme-key>"
disable-model-invocation: true
allowed-tools: Read, Edit, Bash
primary_agent: theme-component-builder
---

`/design-theme-charts` で設計したチャートをテーマページに反映する。

> **完全DBレス (doc12 Phase E)**: page_components の SSOT は **git TS** `apps/web/scripts/data/page-components/`。
> 永続/リモート D1 への INSERT は廃止。**JSON を直接編集 → generator で R2 反映 → verify** のフローに統一。
>
> **★ ただしカタログ駆動テーマ (2026-07-04〜)**: `THEME_CATALOGS` 登録テーマの `page-components/theme/<key>.json` は
> **`packages/data-configs/src/theme-catalog/<key>.ts` からの生成物 (手編集禁止)**。反映は **カタログ TS を編集 →
> `npm run generate:catalog` → `validate:catalog`** の順。JSON 直接編集は pre-commit/CI の Theme Catalog Gate が弾く。
> legacy (未登録) テーマのみ下記の JSON 直接編集フロー。正典 = `.Codex/rules/theme-catalog-standards.md`。

## SSOT の場所

| pageType | ファイル |
|---|---|
| テーマ | `apps/web/scripts/data/page-components/theme/<theme-key>.json` |
| area-category 共有 | `apps/web/scripts/data/page-components/area-category/<category-key>.json` |
| city-category | `apps/web/scripts/data/page-components/city-category/<category-key>.json` |
| area | `apps/web/scripts/data/page-components/area/<NN000>.json` |

各ファイルは `PageComponent[]` (配列)。1 要素 = 1 チャート。

## PageComponent の構造 (フィールド順を維持)

```json
{
  "componentKey": "<一意キー>",
  "componentType": "bar-chart | line-chart | kpi-card | composition-chart | ...",
  "title": "表示タイトル",
  "componentProps": { "...": "チャート固有 props (estatParams 等)" },
  "sourceName": "出典名 or null",
  "sourceLink": "/ranking/... or null",
  "rankingLink": "/ranking/... or null",
  "gridColumnSpan": 12,
  "gridColumnSpanTablet": null,
  "gridColumnSpanSm": null,
  "dataSource": null,
  "section": "セクション名 or null",
  "sortOrder": 0
}
```

## 設計原則

- **1 ファイル = 1 ページ**: `theme/<key>.json` がそのテーマページの全コンポーネント。`page_component_assignments` は廃止済 (PR #216)
- **再利用**: 他ページの componentKey を載せたい場合、同じ componentKey + 同じ props で対象ページの JSON にも追加
- **重複禁止**: 同一ファイル内で componentKey を重複させない
- **areas との共有**: テーマ用チャートを関連 area-category にも載せる場合、`area-category/<category-key>.json` にも追加
- **composition-chart**: 実行時に e-Stat を fetch する (旧 `component_data` D1 投入は不要・廃止)

## 手順

1. **対象 JSON を Read** し既存配列を把握 (`apps/web/scripts/data/page-components/theme/<theme-key>.json`)
2. **設計済みチャート要素を配列に追加** (Edit)。`sortOrder` で表示順を制御
3. **R2 snapshot を再生成** (DBレス generator):
   ```bash
   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
     apps/web/scripts/export-page-components-snapshot.ts
   ```
4. **検証** (cloud 配信と一致確認。新規追加分は push 前なので差分が出るのは正常):
   ```bash
   R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
     npx tsx apps/web/scripts/verify-page-components-snapshot.ts
   ```
5. **本番反映**: `/push-r2` (または `push-r2-wrangler.ts`) で `.local/r2` → 本番 R2。該当ページの ISR を curl で確認
6. feature ブランチで commit → develop merge → PR develop → main → CI green → deploy

## 関連

- 正典: `docs/01_技術設計/02_データアーキテクチャ.md`（page_components）
- 設計: `/design-theme-charts` / reader: `apps/web/src/features/stat-charts/services/page-components-snapshot.ts`
- 生成: `apps/web/scripts/export-page-components-snapshot.ts` / 検証: `apps/web/scripts/verify-page-components-snapshot.ts`

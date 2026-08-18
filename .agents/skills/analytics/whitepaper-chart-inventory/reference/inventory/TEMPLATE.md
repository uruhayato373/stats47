---
type: whitepaper-chart-inventory
date: YYYY-MM-DD
wp_slug: <wp-slug>
notebook_name: <NotebookLM ノートブック名>
status: plan | query-pending | parsed | reviewed | mapped
chapters: []
tags: [whitepaper, chart-inventory]
---

# {白書名} ({wp_slug}) — チャート逆引き inventory

## 0. 概要

- **白書範囲**: <カバーする政策領域>
- **章構成 (推定)**: <章 1>, <章 2>, ...
- **抽出 chart 数**: <Phase A-2 完了後埋まる>
- **dry run 結果** (Phase A-4 該当白書のみ): <1 query あたり平均抽出件数 / truncate 発生率 / query template 評価>

## 1. nlm CLI 実行コマンド (user 環境で実行)

各章ごとに以下を user 環境で実行し、結果を `.claude/skills/analytics/whitepaper-chart-inventory/reference/queries/<wp-slug>/<chapter>.json` に保存:

```bash
mkdir -p .claude/skills/analytics/whitepaper-chart-inventory/reference/queries/<wp-slug>

# 章 1
node .claude/scripts/notebooklm-cross-query.mjs \
  --notebooks "<ノートブック名>" --json \
  '「<章 1 名>」の章に登場するチャート・図表をすべて列挙してください。各チャートについて以下を JSON 配列で返してください:
[
  {
    "title": "...",
    "chart_type": "line/bar/pie/choropleth/scatter/pyramid/flow/stacked-bar/treemap のいずれか",
    "chart_target": "prefecture/national/age/time-series/cross-section のいずれか",
    "source_stats_name": "...",
    "years_covered": "...",
    "key_insight": "1 行で curiosity gap"
  }
]
プロセス・概念図・写真は除外し、定量データの可視化のみ列挙してください。' \
  > .claude/skills/analytics/whitepaper-chart-inventory/reference/queries/<wp-slug>/chapter-1.json

# 章 2, 3, ... も同様
```

実行後、user から「完了」報告を受けて Step 2 (parse) に進む。

## 2. チャート一覧

| chart_id | chapter | title | chart_type | chart_target | source_stats_name | years_covered | key_insight | responsibility |
|---|---|---|---|---|---|---|---|---|
| <wp-slug>-<chapter>-01 | <章> | <タイトル> | line | national | <統計名> | 2000-2023 | <1 行> | undecided |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

## 3. enum 外 chart_type の出現

抽出された chart のうち、既存 enum (`choropleth/line/pie/bar/ranking-table`) に含まれない type を集計:

| chart_type | 件数 | 既存実装 | Phase D 採否 |
|---|---|---|---|
| pyramid | - | AgeCompositionChart 実装済 | - |
| scatter | - | なし | - |
| ... | - | - | - |

## 4. e-Stat 紐付け (Phase C で埋まる)

`source_stats_name` を `estat_metainfo` カタログ (8000+ 件) と全文検索照合:

| chart_id | source_stats_name | estat_statsDataId | 既存 D1 indicator | ラベル |
|---|---|---|---|---|
| ... | ... | ... | imported / not-imported-available / external-source | - |

ラベル定義:

- `imported`: D1 `indicators` テーブルに既登録 (3064 件のうちのいずれか)
- `not-imported-available`: e-Stat に存在するが D1 未登録 → Phase E 取込候補
- `external-source`: e-Stat に無い (OECD / 内閣府独自 / 民間調査等)

## 5. responsibility 振り分け (Phase D で埋まる)

`docs/01_技術設計/03_情報設計.md` の判定基準に従い:

| responsibility | 件数 | 配置先 |
|---|---|---|
| area | - | `apps/web/src/features/area-profile/` (実装済) |
| theme | - | `apps/web/scripts/data/page-components/theme/<key>.json` (実装済 SSOT)|
| both | - | area / theme 両方 |
| external-source | - | 取込対象外 |

## 6. メモ

- <章ごとの特記事項>
- <応答切れが発生した query があれば記録>
- <白書固有のクセ (例: 「OECD 比較が多い」「県別データが少ない」)>

## 関連

- 親 index: `./README.md`
- 親計画: `/root/.claude/plans/47-swirling-wreath.md`
- スキル: `.claude/skills/analytics/whitepaper-chart-inventory/SKILL.md`

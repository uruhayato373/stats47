---
type: whitepaper-chart-inventory
date: 2026-05-27
wp_slug: recent-whitepapers
notebook_name: 最新の白書
status: plan
chapters:
  - 人口減少
  - AI / Society 5.0
  - GX / カーボンニュートラル
  - その他横断トピック
tags: [whitepaper, chart-inventory, dry-run]
---

# 最新の白書 (recent-whitepapers) — チャート逆引き inventory (Phase A-4 dry run)

## 0. 概要

- **白書範囲**: 政府横断の年次総括 (人口減少 / AI・Society 5.0 / GX-カーボンニュートラル 等)
- **dry run 目的**: query template の汎用性検証、応答切れの有無、章単位分割の妥当性
- **抽出 chart 数**: TBD (user の CLI 実行待ち)
- **章数**: 4 章想定 (notebook 構造を query 1 で確認した後に確定)

## 1. nlm CLI 実行コマンド (user 環境で実行)

下記コマンドをローカル環境 (notebooklm CLI が動く環境) で順次実行してください。**1 query = 30 秒程度** × 5 query = **~3 分** 想定。

```bash
cd /Users/<user>/path/to/stats47  # macOS の場合
mkdir -p .claude/skills/analytics/whitepaper-chart-inventory/reference/queries/recent-whitepapers
```

### Query 0: 章構成の確認 (まず実行)

```bash
node .claude/scripts/notebooklm-cross-query.mjs \
  --notebooks "最新の白書" --json \
  '本白書の章構成 (大章のみ) を JSON 配列で列挙してください。例: ["第1章 人口減少", "第2章 AI", ...]。最大 10 章まで。' \
  > .claude/skills/analytics/whitepaper-chart-inventory/reference/queries/recent-whitepapers/chapters.json
```

→ この結果を見て下記 4 query の章名を確定する。

### Query 1: 人口減少 章

```bash
node .claude/scripts/notebooklm-cross-query.mjs \
  --notebooks "最新の白書" --json \
  '「人口減少」に関する章に登場するチャート・図表をすべて列挙してください。各チャートについて以下を JSON 配列で返してください:
[
  {
    "title": "チャートのタイトル (白書原文ママ)",
    "chart_type": "line/bar/pie/choropleth/scatter/pyramid/flow/stacked-bar/treemap のいずれか",
    "chart_target": "prefecture (47県別)/national (全国一系列)/age (年齢構成)/time-series (年次推移)/cross-section (一時点断面) のいずれか",
    "source_stats_name": "出典統計名 (図注に書かれているもの)",
    "years_covered": "対象年次",
    "key_insight": "1 行で curiosity gap"
  }
]
プロセス図・概念図・写真は除外し、定量データの可視化のみ列挙してください。最大 15 件。' \
  > .claude/skills/analytics/whitepaper-chart-inventory/reference/queries/recent-whitepapers/01-population.json
```

### Query 2: AI / Society 5.0 章

```bash
node .claude/scripts/notebooklm-cross-query.mjs \
  --notebooks "最新の白書" --json \
  '「AI / Society 5.0 / デジタル」に関する章に登場するチャート・図表を列挙。JSON 配列の各要素は {title, chart_type, chart_target, source_stats_name, years_covered, key_insight}。最大 15 件、定量データの可視化のみ。' \
  > .claude/skills/analytics/whitepaper-chart-inventory/reference/queries/recent-whitepapers/02-ai.json
```

### Query 3: GX / カーボンニュートラル 章

```bash
node .claude/scripts/notebooklm-cross-query.mjs \
  --notebooks "最新の白書" --json \
  '「GX / カーボンニュートラル / 脱炭素」に関する章のチャート・図表を列挙。JSON 配列 {title, chart_type, chart_target, source_stats_name, years_covered, key_insight}。最大 15 件、定量データのみ。' \
  > .claude/skills/analytics/whitepaper-chart-inventory/reference/queries/recent-whitepapers/03-gx.json
```

### Query 4: その他横断トピック

```bash
node .claude/scripts/notebooklm-cross-query.mjs \
  --notebooks "最新の白書" --json \
  '上記 3 章 (人口減少/AI/GX) 以外の章 (例: 経済、地域活性化、安全保障 等) に登場するチャート・図表を列挙。JSON 配列 {title, chart_type, chart_target, source_stats_name, years_covered, key_insight}。最大 15 件、定量データのみ。' \
  > .claude/skills/analytics/whitepaper-chart-inventory/reference/queries/recent-whitepapers/04-other.json
```

### 実行後

5 ファイル (`chapters.json` + 4 章 json) が揃ったら user は「dry run 完了」と Claude に報告。Claude は parse mode に切り替えてテーブル整形 (本 MD の §2) を実行する。

## 2. チャート一覧 (Step 2 parse 完了後に埋まる)

| chart_id | chapter | title | chart_type | chart_target | source_stats_name | years_covered | key_insight | responsibility |
|---|---|---|---|---|---|---|---|---|
| _(user の CLI 実行後に skill が parse して埋まる)_ | | | | | | | | undecided |

## 3. enum 外 chart_type の出現

| chart_type | 件数 | 既存実装 | Phase D 採否 |
|---|---|---|---|
| _(parse 後に埋まる)_ | | | |

## 4. e-Stat 紐付け (Phase C で埋まる)

| chart_id | source_stats_name | estat_statsDataId | 既存 D1 indicator | ラベル |
|---|---|---|---|---|
| _(Phase C で埋まる)_ | | | | |

## 5. responsibility 振り分け (Phase D で埋まる)

| responsibility | 件数 | 配置先 |
|---|---|---|
| area | - | `apps/web/src/features/area-profile/` (実装済) |
| theme | - | `apps/web/scripts/data/page-components/theme/<key>.json` (実装済 SSOT)|
| both | - | area / theme 両方 |
| external-source | - | 取込対象外 |

## 6. dry run 評価メモ (CLI 実行後に追記)

### 評価項目

- [ ] 各 query で 5-15 件の chart 抽出が得られたか
- [ ] chart_type が enum + 拡張候補リストで網羅できたか
- [ ] 出典統計名が citation 付きで取れたか
- [ ] 1 query の応答切れ (truncate) が 1 回以下か
- [ ] JSON parse がそのまま通ったか (markdown コードフェンスの剥離だけで済んだか)

### 合格判定

全項目クリア → Phase B (残り 10 白書) 着手 OK
2 項目以上不合格 → query template 再設計、本ファイルの §1 を更新して再試行

### 観察事項 (実行後に記入)

- _応答時間: chart 当たり ~_ 秒_
- _応答品質: 出典統計名の citation 率 ~_ %_
- _特異事項: _

## 関連

- 親 index: `./README.md`
- 親計画: `/root/.claude/plans/47-swirling-wreath.md`
- スキル: `.claude/skills/analytics/whitepaper-chart-inventory/SKILL.md`

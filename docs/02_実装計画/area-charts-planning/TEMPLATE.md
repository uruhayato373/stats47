---
type: area-chart-planning
date: YYYY-MM-DD
theme_key: <theme-key>
status: drafted | reviewed | seeded
research_sources: []
tags: [area-charts]
---

# {タイトル} ({theme_key}) — area チャート構成設計

`/areas/[code]` で本テーマ領域について **県固有の** 可視化を行うチャート構成。47 県横断・主題深掘りは theme 側 (`../theme-charts-planning/<theme_key>.md`) に置く。

## 0. 結論サマリ (3 文以内)

このテーマで area に配置する 3 種のチャートを一言で。
(例: 「都道府県の人口時系列 line + 年齢ピラミッド + 人口増減トップ市区町村」)

## 1. 既存 metric 棚卸し (本テーマで area に出すべきもの)

| rankingKey | shortLabel | role | 想定 chart_type | データ可用性メモ |
|---|---|---|---|---|
| <key> | <短縮ラベル> | primary / secondary / context | line / pie / bar / ranking-table | <年次・最新年・更新頻度> |

役割の定義:

- **primary**: 県プロフィールのファーストビューに置く 1 つ (例: 人口、寿命)
- **secondary**: 2 番手の補助チャート (例: 年齢構成、産業構成)
- **context**: 文脈補助 (例: 全国平均と単県の対比指標、市区町村内訳)

## 2. 推奨レイアウト

### 2-1. メインビュー (上段)

primary metric の **県固有 line** (例: 「{県名} の {指標名} の年次推移 2000-2024")
- chart_type: `line`
- chart_target: `prefecture` (単県のみ。47 県重ね合わせは theme へ)
- 年次幅: ~25 年 (取得可能な範囲)
- curiosity gap: <例「過去最高」「半減」「逆転」>

### 2-2. サブパネル (中段 2 種、横並び or 縦積み)

#### (A) 構成可視化 (pie / bar)

(例: 年齢ピラミッド / 産業構成 / 職業構成)

- chart_type: `pie` or `bar` (年齢の場合 `pyramid` 拡張候補)
- chart_target: `prefecture`
- 単県の内訳を見せる。47 県比較ではない

#### (B) 市区町村内訳 (ranking-table)

(例: 県内市区町村 top 10 人口、top 5 高齢化率)

- chart_type: `ranking-table`
- chart_target: `prefecture` (intra-prefecture cities)
- 市区町村データが必要 (`stats_city` テーブル)
- 政令市・特別区がない県では「全市区町村」表示で OK

### 2-3. (Optional) 強み / 弱みカード

このテーマ領域での当該県の全国順位を 1-2 個カードで提示 (47 県中 N 位)。これはチャートではなく数値カード扱い。

## 3. 責務分離チェック

- [ ] すべてのチャートが `chart_target: prefecture` か？
- [ ] 「47 県を比較する地図」を含んでいないか？ (含んでいるなら theme へ)
- [ ] 「全国の主題横断時系列」を含んでいないか？ (含んでいるなら theme へ)
- [ ] 「全国平均と単県の対比」だけのチャートを含んでいないか？ (含んでいるなら ranking へ)

判定基準: `docs/01_技術設計/07_情報設計.md`

## 4. 白書由来の追加チャート候補 (Phase D で埋まる)

`docs/02_実装計画/whitepaper-chart-inventory/<wp-slug>.md` で `responsibility = area / both` と判定された chart のうち、本テーマに該当するもの:

| chart_id (白書由来) | title | chart_type | データ可用性 | 採否 |
|---|---|---|---|---|
| <wp-slug>#<chart_id> | <タイトル> | line/pie/bar | imported / not-imported-available / external-source | 採用 / 不採用 (理由) |

## 5. 必要データ (Phase E seed 時)

- 既存 D1 indicator で揃うもの: <列挙>
- 新規取込が必要なもの (`not-imported-available`): <列挙、estat statsDataId 付き>
- 取込不可 (`external-source`): <列挙、代替案>

## 6. SEO / curiosity gap 観点

各チャートのタイトル / キャプションに curiosity gap を入れる方針 (`.claude/rules/blog-quality-standards.md` 準拠):

- 「なぜ X 県が突出?」「全国 N 倍格差」「過去 N 年で逆転」

## 7. 残課題 / 要検証

- <疑問点・要 user 判断>
- <データ取得制約 (年次更新の有無、サンプル偏り等)>

## 関連ファイル

- 親 index: `./README.md`
- 対応する theme 計画: `../theme-charts-planning/<theme_key>.md`
- 責務分離ルール: `docs/01_技術設計/07_情報設計.md`
- area 実装: `apps/web/src/features/area-profile/`
- 親計画: `/root/.claude/plans/47-swirling-wreath.md`

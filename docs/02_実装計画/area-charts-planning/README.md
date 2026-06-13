---
type: area-charts-planning-index
date: 2026-05-27
status: active
target: /areas/[code] チャート構成リッチ化 (47 都道府県プロフィール)
tags: [area-charts, planning]
---

# area プロフィール チャート構成設計 — INDEX

`/areas/[code]` (47 都道府県の自己紹介ハブ) に配置するチャートを **テーマ単位 (17 テーマ)** で設計する。

**責務**: 「この県の特徴を知りたい」── 県固有の時系列、年齢構成、強み/弱み、市区町村内訳。主題横断・47 県比較は theme 側 (`docs/02_実装計画/theme-charts-planning/`) に置く。

`page_components.pageType = "area"` への seed の入力となる。

## 親計画

- `/root/.claude/plans/47-swirling-wreath.md` — Phase A-E 全体計画
- `docs/01_技術設計/07_情報設計.md` — area / theme 責務判定基準 (本計画の絶対準拠先)
- `docs/02_実装計画/theme-charts-planning/README.md` — theme 側の対応する設計 (mirror 元)
- `docs/02_実装計画/whitepaper-chart-inventory/README.md` — Phase D で本計画に振り分けられる素材リスト

## 進捗表

theme-charts-planning の 17 テーマと**同じテーマ key** を採用し、各テーマで area 側に配置すべきチャート (= 県固有・時系列・構成) を設計する。

| テーマ | カテゴリ | 対応 theme 計画 | status | レビュー済 |
|---|---|---|---|---|
| population-dynamics | demographics | [theme](../theme-charts-planning/population-dynamics.md) | not-started | - |
| aging-society | demographics | [theme](../theme-charts-planning/aging-society.md) | not-started | - |
| living-housing | lifestyle | [theme](../theme-charts-planning/living-housing.md) | not-started | - |
| local-economy | economy | [theme](../theme-charts-planning/local-economy.md) | not-started | - |
| labor-wages | economy | [theme](../theme-charts-planning/labor-wages.md) | not-started | - |
| manufacturing | industry | [theme](../theme-charts-planning/manufacturing.md) | not-started | - |
| healthcare | welfare | [theme](../theme-charts-planning/healthcare.md) | not-started | - |
| safety | safety | [theme](../theme-charts-planning/safety.md) | not-started | - |
| education-culture | education | [theme](../theme-charts-planning/education-culture.md) | not-started | - |
| tourism | tourism | [theme](../theme-charts-planning/tourism.md) | not-started | - |
| consumer-prices | economy | [theme](../theme-charts-planning/consumer-prices.md) | not-started | - |
| foreign-residents | demographics | [theme](../theme-charts-planning/foreign-residents.md) | not-started | - |
| occupation-salary | economy | [theme](../theme-charts-planning/occupation-salary.md) | not-started | - |
| real-income | economy | [theme](../theme-charts-planning/real-income.md) | not-started | - |
| labor-mobility | economy | [theme](../theme-charts-planning/labor-mobility.md) | not-started | - |
| local-finance | economy | [theme](../theme-charts-planning/local-finance.md) | not-started | - |
| fishery-marine | industry | [theme](../theme-charts-planning/fishery-marine.md) | not-started | - |

**全 17 テーマ未着手 (2026-05-27)**。Phase D (whitepaper-chart-inventory の振り分け完了) 後に着手予定。

status: `not-started` → `drafted` (Agent によるリサーチ稿) → `reviewed` (人間確認済) → `seeded` (D1 投入完了)

## area に配置するチャート (3 種)

`docs/01_技術設計/07_情報設計.md` の判定基準に従い、area には以下のみ:

| chart_type | 用途 | 例 |
|---|---|---|
| **県固有の時系列推移** (line) | 「東京の人口の年次推移」「島根の医師数の年次推移」 | 主要 metric の単県推移 |
| **県の年齢構成 / 産業構成** (pie / bar) | 「沖縄の年齢ピラミッド」「愛知の産業構成」 | 単県の構造可視化 |
| **県内市区町村ランキング** (ranking-table) | 「神奈川の市区町村人口 top 10」 | intra-prefecture top/bottom |

NG (theme へ):

- ❌ 47 県を比較する地図 (choropleth) → theme へ
- ❌ 主題全体の可視化 (移動フロー等) → theme へ
- ❌ 全国平均との対比だけのチャート → ranking へ

## テンプレート

各テーマファイルは `TEMPLATE.md` の構造に統一する。

## chart_target の扱い

area は `chart_target: prefecture` に**限定**する。`national` / `age` / `time-series` の全国 broadcast は theme 側に配置すること (`theme_metrics.chart_target` enum 既存対応)。

## Phase D での反映

`docs/02_実装計画/whitepaper-chart-inventory/<wp-slug>.md` の各 chart 行で `responsibility = area` (または `both`) と判定されたものを、本ディレクトリの対応テーマファイルに転記する。

転記時の追加情報:

- `whitepaper_source` 列に由来白書 + chart_id を記入 (例: `recent-whitepapers#recent-pop-03`)
- area で使う際に「全 47 県分のデータが揃うか」を確認 (theme 側で全国一括の方が良ければ both → theme のみに移行)

## 関連

- 責務分離ルール: `docs/01_技術設計/07_情報設計.md`
- mirror 元: `docs/02_実装計画/theme-charts-planning/README.md`
- 素材リスト: `docs/02_実装計画/whitepaper-chart-inventory/README.md`
- area 実装: `apps/web/src/features/area-profile/`
- 親計画: `/root/.claude/plans/47-swirling-wreath.md`

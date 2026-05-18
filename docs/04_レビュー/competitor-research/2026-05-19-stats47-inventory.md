---
type: stats47-inventory
date: 2026-05-19
status: completed
total_indicators: 1950
total_categories: 17
total_themes: 17
tags: [stats47, baseline, indicator-expansion]
---

# stats47 既存指標の網羅集計 (2026-05-19)

## サマリ

| 指標 | 値 | 備考 |
|---|---|---|
| 総指標数 (active) | 1,950 | `metrics WHERE is_active=1` |
| 総指標数 (all) | 2,157 | inactive 207 件含む |
| Featured 指標数 | 8 | `is_featured=1` |
| カテゴリ数 (公式) | 17 | `categories` テーブル |
| 未分類 category_key | 3 種 | `(null)` / `port` (9) / `labor` (1) — 要正規化 |
| テーマ数 | 17 | `page_components.page_type='theme'` |
| 時系列指標数 (>=2 年) | 1,502 | `stats_prefecture` GROUP BY metric_key |
| 単年指標数 (=1 年) | 620 | 内 active のみ集計可 |
| データなし指標数 (active) | 25 | `stats_prefecture` に行なし |
| 全体 中央値年数 | 18 年 | 時系列指標の年数中央値 |
| 都道府県あたり平均指標数 | 2,116 | `stats_prefecture GROUP BY area_code` |
| 13/27/47 都道府県カバレッジ | 2,121 / 2,122 / 2,117 | ほぼ均等、空白なし |

備考: `subcategories` テーブルは存在せず、`metrics.category_key` の単一階層のみ。「カテゴリ | サブカテゴリ」表は category_key 単位で出力する。

## カテゴリ別内訳 (active 1,950)

| 大カテゴリ (category_name) | category_key | 指標数 | 時系列 (>=2y) | 単年 | データ無 | 中央値年数 | 主要 slug 例 |
|---|---|---|---|---|---|---|---|
| 企業・家計・経済 | economy | 759 | 727 | 31 | 1 | 18 | accessories-consumption-expenditure |
| 教育・文化・スポーツ | educationsports | 231 | 119 | 112 | 0 | 4 | adult-class-lecture-count-per-million |
| 社会保障・衛生 | socialsecurity | 215 | 136 | 78 | 1 | 13 | abortion-rate |
| 人口・世帯 | population | 115 | 74 | 39 | 2 | 9 | accidental-deaths-per-100k |
| 行財政 | administrativefinancial | 107 | 88 | 18 | 1 | 16 | actual-income-worker-households-per-month |
| 司法・安全・環境 | safetyenvironment | 97 | 70 | 25 | 2 | 34 | annual-emergency-dispatches-per-1000 |
| 労働・賃金 | laborwage | 78 | 50 | 28 | 0 | 3 | accountant-annual-income |
| 住宅・土地・建設 | construction | 71 | 34 | 36 | 1 | 1 | apartment-ratio |
| 商業・サービス業 | commercial | 52 | 36 | 15 | 1 | 5 | annual-sales-amount |
| 社会基盤施設 | infrastructure | 46 | 18 | 28 | 0 | 1 | airport-count |
| 農林水産業 | agriculture | 44 | 28 | 16 | 0 | 24 | abandoned-cultivated-land-area |
| 運輸・観光 | tourism | 39 | 19 | 20 | 0 | 1 | air-cargo-transport |
| 国土・気象 | landweather | 37 | 23 | 13 | 1 | 24 | agricultural-land-conversion-area |
| エネルギー・水 | energy | 19 | 4 | 15 | 0 | 1 | biomass-power-station-count |
| 情報通信・科学技術 | ict | 12 | 8 | 4 | 0 | 12 | car-ownership-multi-person-households-per-1000 |
| 鉱工業 | miningindustry | 10 | 5 | 0 | 5 | 34 | industrial-land-price |
| 国際 | international | 8 | 0 | 7 | 1 | 1 | foreign-population-per-100k |
| (未分類) | port | 9 | 0 | 0 | 9 | - | port-cargo-coastal-in |
| (未分類) | labor | 1 | 0 | 1 | 0 | 1 | non-regular-employment-rate |

## テーマ別指標数 (17 テーマ)

| theme_key | チャート数 (chart_key) | 直近更新 (page_components) | 想定カテゴリ |
|---|---|---|---|
| aging-society | 13 | 2026-05-18 | socialsecurity, population |
| local-finance | 12 | 2026-05-16 | administrativefinancial |
| population-dynamics | 8 | 2026-05-18 | population |
| consumer-prices | 6 | 2026-05-18 | economy |
| fishery-marine | 6 | 2026-04-25 | agriculture |
| healthcare | 6 | 2026-05-18 | socialsecurity |
| labor-wages | 6 | 2026-05-18 | laborwage |
| local-economy | 6 | 2026-05-18 | economy |
| education-culture | 5 | 2026-05-18 | educationsports |
| labor-mobility | 5 | 2026-05-18 | laborwage, population |
| living-housing | 5 | 2026-05-18 | construction |
| occupation-salary | 5 | 2026-03-26 | laborwage |
| safety | 4 | 2026-03-25 | safetyenvironment |
| foreign-residents | 3 | 2026-03-26 | population, international |
| manufacturing | 2 | 2026-03-26 | miningindustry, commercial |
| real-income | 2 | 2026-03-26 | economy, laborwage |
| tourism | 2 | 2026-03-26 | tourism |

合計 chart_key 数: 96 (但し metric_key への 1:1 対応ではなく、複数チャートが同 metric を使う場合あり)。

## e-Stat メタ突合

| status | 件数 | 内訳上位 (category_key) |
|---|---|---|
| registered | 62 | (null) 23 / population 9 / educationsports 6 / safetyenvironment 4 / landweather 3 / economy 3 / construction 3 |
| candidate | 8,838 | agriculture 2,443 / construction 1,464 / socialsecurity 1,044 / population 972 / educationsports 968 / economy 856 / laborwage 485 |

- registered 62 件は active metrics 1,950 と直接対応しない (metrics は estat 以外も含む)。
- candidate 8,838 件は **拡充プール候補** (status='candidate')。category_key 未付与 (null) 439 件は分類タグ付け要。
- 拡充余地大: agriculture (現 44 → 候補 2,443)、construction (現 71 → 1,464)、socialsecurity (現 215 → 1,044)。

## areas ページの時系列カバレッジ

- **47 都道府県すべてで均等**にカバー (13 東京 2,121 / 27 大阪 2,122 / 47 沖縄 2,117 metric)
- 1 都道府県あたり平均 **2,116 metric** のレコード保有 (全 active の ~108%、複数 year_code でカウント済)
- 時系列カバレッジが薄いカテゴリ: **エネルギー・水** (時系列 4/19, 21%)、**国際** (0/8, 0%)、**運輸・観光** (19/39, 49%)、**社会基盤施設** (18/46, 39%)
- **port** (9 件) と **labor** (1 件) の category_key は正規化必要 (categories テーブルに該当 row なし)

## 拡充計画に向けた baseline 所見

1. **総 1,950 active** は memory `MEMORY.md` の 533 件記録と乖離 → memory 更新要 (533 は ranking_items 旧テーブルの値の可能性)
2. **時系列対応率 77%** (1,502 / 1,950) — 単年 620 件は areas ページの推移チャート生成不可
3. **拡充の最大プール**: agriculture / construction / socialsecurity の candidate 計 4,951 件 (全 candidate の 56%)
4. **テーマ未活用カテゴリ**: ict (12 件), international (8 件), miningindustry (10 件), energy (19 件) はテーマページなし
5. **テーマ ↔ metric 紐付け**: 17 テーマで chart_key 計 96 個。1,950 active のうち実際にテーマで表示される指標は少数 → ロングテール SEO は ranking ページに依存

## SELECT 出典コマンド

```bash
DB=.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite

# active 総数
sqlite3 "$DB" "SELECT COUNT(*) FROM metrics WHERE is_active=1;"
# カテゴリ別 + 時系列/単年/データ無
sqlite3 "$DB" "WITH yrs AS (SELECT metric_key, COUNT(DISTINCT year_code) AS y FROM stats_prefecture GROUP BY metric_key) SELECT COALESCE(c.category_name, m.category_key, '(null)'), COUNT(*), SUM(CASE WHEN yrs.y>=2 THEN 1 ELSE 0 END), SUM(CASE WHEN yrs.y=1 THEN 1 ELSE 0 END), SUM(CASE WHEN yrs.y IS NULL THEN 1 ELSE 0 END) FROM metrics m LEFT JOIN categories c ON c.category_key=m.category_key LEFT JOIN yrs ON yrs.metric_key=m.key WHERE m.is_active=1 GROUP BY m.category_key ORDER BY COUNT(*) DESC;"
# テーマ
sqlite3 "$DB" "SELECT page_key, COUNT(*), MAX(updated_at) FROM page_components WHERE page_type='theme' AND is_active=1 GROUP BY page_key;"
# estat
sqlite3 "$DB" "SELECT status, category_key, COUNT(*) FROM estat_metainfo GROUP BY status, category_key;"
```

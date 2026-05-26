---
type: theme-chart-planning
date: 2026-05-26
theme_key: labor-wages
status: drafted
research_sources:
  - https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/z2024/index.html
  - https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/minimumichiran/index.html
  - https://www.jil.go.jp/kokunai/blt/backnumber/2024/10/special_01.html
  - https://www.nippon.com/ja/japan-data/h02116/
  - https://www.mlit.go.jp/report/press/toshi03_hh_000128.html
  - https://www.nli-research.co.jp/report/detail/id=75074?site=nli
tags: [theme-charts, labor-wages]
---

# 労働・賃金 (labor-wages) — チャート構成設計

## 0. 結論サマリ

左コロプレスで **最低賃金 (2024 年 10 月改定、全国加重平均 1,055 円)** を地図表示、右に **(A) 全国推移ライン (最低賃金 2000→2024 で 659→1,055 円、初年比 +60%)**、**(B) 雇用形態別構成バー (正規/非正規/役員)**、**(C) 上下位 5 県バー (東京 1,163 円 vs 秋田・高知等 951 円、格差 1.22 倍)** の 3 枚を縦に積む。男女格差タブには「都道府県別 男女賃金比率」line + bar を追加して **「OECD 平均 88% に対し日本 78.7%、栃木 71.0% vs 高知 80.4%」** を curiosity gap として打ち出す。

## 1. 既存 metric 棚卸し

| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |
|---|---|---|---|---|---|---|
| `minimum-wage-by-region` | 最低賃金 | primary | 賃金 | choropleth + line + bar | prefecture / national | 厚労省 地域別最低賃金 (年次, 1978-) |
| `starting-salary-university` | 大卒初任給 | secondary | 賃金 | choropleth + line | prefecture / national | 賃金構造基本統計調査 (年次) |
| `starting-salary-highschool` | 高卒初任給 | context | 賃金 | choropleth | prefecture | 同上 |
| `scheduled-salary-male` | 所定内給与(男) | context | 賃金 / 男女格差 | choropleth + bar | prefecture | 同上 |
| `nurse-salary` | 看護師年収 | secondary | 賃金 | choropleth | prefecture | 賃金構造基本統計調査 職種別 |
| `gender-wage-gap` | 男女賃金格差 | secondary | 男女格差 | choropleth + line + bar | prefecture / national | 厚労省 都道府県別公表 (2023~) |
| `male-part-time-hourly-wage` | パート時給(男) | context | 男女格差 | choropleth | prefecture | 賃金構造基本統計調査 短時間 |
| `female-part-time-hourly-wage` | パート時給(女) | context | 男女格差 | choropleth | prefecture | 同上 |
| `active-job-opening-ratio` | 有効求人倍率 | secondary | 雇用 | choropleth + line | prefecture / national | 一般職業紹介状況 (月次, 厚労省) |
| `unemployment-rate` | 失業率 | secondary | 雇用 | choropleth + line | prefecture / national | 労働力調査 (四半期) |
| `employment-rate` | 就業率 | context | 雇用 | choropleth + line | prefecture / national | 同上 |
| `employed-people-ratio` | 有業率 | context | 雇用 | choropleth | prefecture | 就業構造基本調査 (5 年ごと) |
| `telework-rate` | テレワーク率 | secondary | 働き方 | choropleth + line + bar | prefecture / national | 国交省 テレワーク人口実態調査 (年次) |
| `side-job-rate` | 副業率 | context | 働き方 | choropleth | prefecture | 就業構造基本調査 |
| `monthly-average-actual-working-hours-male` | 月間労働時間(男) | context | 働き方 | choropleth + line | prefecture / national | 毎月勤労統計調査 |
| `turnover-rate` | 離職率 | context | 働き方 | choropleth | prefecture | 雇用動向調査 |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `minimum-wage-by-region` (地域別最低賃金, 2024 年 10 月改定)

- 最新値: 全国加重平均 1,055 円 (前年 1,004 円、+51 円で過去最大の引上げ)
- 配色: 緑〜青のシーケンシャル (高いほど濃い)
- ホバー時: 県名 + 時給 + 全国順位 + 前年比 (円・%)

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 全国推移ライン

**何を見せるか**: 全国加重平均 最低賃金の推移 (2000-2024)

- curiosity gap: **「2000 年 659 円 → 2024 年 1,055 円、24 年で +60%・直近 3 年で +166 円」**
- 必要データ: `app/themes/labor-wages/timeseries/minimum-wage-national.json`
  ```json
  { "metricKey": "minimum-wage-by-region", "scope": "national",
    "unit": "円", "series": [{ "year": 2000, "value": 659 }, ..., { "year": 2024, "value": 1055 }] }
  ```

#### (B) 雇用形態別構成バー / 男女賃金比率パイ

**何を見せるか**: 就業者の **雇用形態別構成** (正規/非正規/役員/自営) — 全国・都道府県切替

| 区分 | 比率 (全国 2022) | 備考 |
|---|---|---|
| 正規雇用 | 約 53% | フルタイム長期 |
| 非正規雇用 (パート/アルバイト/契約/派遣) | 約 37% | 増加トレンド |
| 役員 | 約 3% | |
| 自営業主・家族従業者 | 約 7% | 農林水産県で高い |

- データ源: e-Stat 就業構造基本調査 (statsDataId 系列、`cdCat01` で雇用形態区分)
- 必要データ: `app/themes/labor-wages/breakdown/employment-status.json`

#### (C) 上下位 5 県バーチャート

**何を見せるか**: 最低賃金 TOP 5 + BOTTOM 5 (2024)

```
東京都   1,163 円 ▰▰▰▰▰▰▰▰▰▰
神奈川県 1,162 円 ▰▰▰▰▰▰▰▰▰▰
大阪府   1,114 円 ▰▰▰▰▰▰▰▰▰
埼玉県   1,078 円 ▰▰▰▰▰▰▰▰
愛知県   1,077 円 ▰▰▰▰▰▰▰▰
─ 全国加重平均 1,055 円 ─
青森県     953 円 ▰▰▰
岩手県     952 円 ▰▰▰
沖縄県     952 円 ▰▰▰
高知県     952 円 ▰▰▰
秋田県     951 円 ▰▰▰
```

- `app/ranking/minimum-wage-by-region/values.json` から派生 (別 export 不要)

### 2-3. パネルタブ — 既存維持 + 補助チャート追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **賃金** | minimum-wage / starting-salary-{univ,hs} / scheduled-salary-male / nurse-salary | line: 大卒初任給 全国推移 (2014→2024 で 20.2 万 → 24.8 万、+23%)<br>bar: 学歴別初任給格差 (大卒 vs 高卒 vs 専門卒) |
| **男女格差** | gender-wage-gap / scheduled-salary-male / part-time-hourly-{male,female} | line: 男女賃金比率の全国推移 (1990→2023 で 60% → 75% 緩やかに改善)<br>bar: OECD 比較 (日本 78.7% vs OECD 平均 88.4%、ワースト 3 位) |
| **雇用** | active-job-opening-ratio / unemployment-rate / employment-rate / employed-people-ratio | line: 有効求人倍率の全国推移 (リーマン 0.42 → 2018 1.61 → コロナ 1.10 → 2024 1.25)<br>line: 失業率の全国推移 |
| **働き方** | telework-rate / side-job-rate / working-hours-male / turnover-rate | line: テレワーク実施率 全国推移 (2019 9.8% → 2020 23% → 2023 16.1%)<br>bar: テレワーク率 東京圏 22% vs 地方圏 8% の格差 |
| **考察** | (空) | 本文記事用 |

## 3. 参考にしたサイト (リサーチ結果)

- [厚生労働省 令和6年賃金構造基本統計調査](https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/z2024/index.html) — 大卒初任給 248.3 千円等の全国・都道府県別公式値。代表チャートは「年齢階級別賃金カーブ」と「都道府県別賃金 bar」
- [厚生労働省 地域別最低賃金の全国一覧](https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/minimumichiran/index.html) — 47 都道府県の最新時給・適用日・前年比を表組み公開
- [JILPT: 全国平均は51円増の1,055円に、16都道府県が1,000円超 (2024年10月号)](https://www.jil.go.jp/kokunai/blt/backnumber/2024/10/special_01.html) — 改定額分析の代表記事。「過去最高 +51 円」の curiosity gap 表現
- [Nippon.com: 男女の賃金差 最大は栃木、最小は高知](https://www.nippon.com/ja/japan-data/h02116/) — 都道府県別男女格差 (栃木 71.0% / 高知 80.4% / 全国 74.8%) の数値ソース。一般読者向け表現の参考
- [国交省 令和5年度テレワーク人口実態調査](https://www.mlit.go.jp/report/press/toshi03_hh_000128.html) — 「全国 13% vs 東京圏 22%」「ハイブリッドワーク拡大」等の curiosity gap 数値
- [ニッセイ基礎研: 市区町村別テレワーカー率推計 (2023)](https://www.nli-research.co.jp/report/detail/id=75074?site=nli) — 県・市区町村粒度の推計手法、地方ほど 3-5% に留まる実態

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (national) | `minimum-wage-by-region` | 2000-2024 (25 点) | `app/themes/labor-wages/timeseries/minimum-wage-national.json` | 厚労省 地域別最低賃金 全国加重平均 |
| timeseries (national) | `starting-salary-university` | 2014-2024 | `app/themes/labor-wages/timeseries/starting-salary-university.json` | 賃金構造基本統計調査 |
| timeseries (national) | `gender-wage-gap` | 1990-2024 (年次) | `app/themes/labor-wages/timeseries/gender-wage-gap.json` | 賃金構造基本統計調査 男女別 |
| timeseries (national) | `active-job-opening-ratio` | 2000-2024 | `app/themes/labor-wages/timeseries/active-job-opening-ratio.json` | 一般職業紹介状況 |
| timeseries (national) | `unemployment-rate` | 2000-2024 | `app/themes/labor-wages/timeseries/unemployment-rate.json` | 労働力調査 |
| timeseries (national) | `telework-rate` | 2016-2024 | `app/themes/labor-wages/timeseries/telework-rate.json` | 国交省 テレワーク人口実態調査 |
| breakdown (bar/pie) | `employment-status` | 2022 | `app/themes/labor-wages/breakdown/employment-status.json` | 就業構造基本調査 雇用形態別 |
| breakdown (bar) | `gender-wage-gap` | latest | `app/themes/labor-wages/breakdown/gender-wage-international.json` | OECD Stats (日本 vs OECD 平均 vs 韓国・米国・独) |

**統合 JSON 案** (1 fetch 構成):

```json
{
  "themeKey": "labor-wages",
  "timeseries": {
    "minimum-wage-by-region": { "scope": "national", "unit": "円", "series": [...] },
    "gender-wage-gap": { ... },
    "telework-rate": { ... }
  },
  "breakdown": {
    "employment-status": { "label": "雇用形態", "items": [...] },
    "gender-wage-international": { "label": "OECD 比較", "items": [...] }
  }
}
```

→ `app/themes/labor-wages/charts.json` 1 ファイルにまとめる方が fast。

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `non-regular-employment-ratio` (非正規雇用比率) | 「雇用の 4 割が非正規」は強い curiosity gap。沖縄 44% vs 北陸 30% 台の地域差 | e-Stat 就業構造基本調査 (statsDataId 0003443885 系) |
| `gender-employment-rate-gap` (女性就業率の男女差) | 賃金格差の上流。北陸・東北は女性就業率 70% 超、首都圏は 60% 台 | 労働力調査 (年次) |
| `minimum-wage-yoy-change-rate` (最低賃金 前年比 %) | 2024 年は秋田 +5.8% で全国最高引上げ率。「東京は +4.5% に対し地方が逆転」 | 厚労省 地域別最低賃金 (差分計算) |
| `regular-wage-gap-tokyo-vs-prefecture` (東京比 賃金比率) | 大都市と地方の賃金格差を 1 指標で可視化 (沖縄は東京の 65%) | 賃金構造基本統計調査 |

非正規雇用比率は **最優先で追加候補**。男女格差・働き方タブ両方に効く。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実:

1. **「最低賃金 24 年で +60%、過去最大の引上げが続く 2024 年」** — 数値推移の劇的変化
2. **「東京 1,163 円 vs 秋田 951 円、最低賃金格差 1.22 倍は縮小中?」** — 比較 + 疑問形
3. **「男女賃金 OECD ワースト 3 位、栃木 71% と高知 80% の意外な差」** — 国際比較 + 国内意外性
4. **「テレワーク 東京圏 22% vs 地方圏 8%、コロナ後も拡大する『働き方の地域分断』」** — 倍率 + 真因
5. **「大卒初任給は 10 年で +23%、それでも非正規 37% が引き上げる平均賃金の天井」** — 逆説

theme description (D1 themes.description) 書き換え案:

> 「2024 年最低賃金 全国平均 1,055 円・過去最大 +51 円改定──東京 1,163 円 vs 秋田 951 円、男女賃金格差は OECD ワースト 3 位 (日本 78.7% vs OECD 平均 88.4%)。47 都道府県の賃金・雇用・働き方を地図とランキングで比較。」

## 7. 残課題 / 要検証

- [ ] `minimum-wage-by-region` の時系列を 2000 年以降 25 点取れるか確認 (年次データ、厚労省 PDF 表からの CSV 化が必要かも)
- [ ] `gender-wage-gap` の都道府県別公表は 2023 年が初。時系列 line は全国値のみで OK か、県別 5 年比較が必要か判断
- [ ] テレワーク率の都道府県別データは国交省 PDF からの抽出が必要 (e-Stat には未収載の可能性)。NIRA 調査・ニッセイ推計でも補完可
- [ ] 雇用形態別 breakdown の cdCat 構造を `/inspect-estat-meta` で確認 (就業構造基本調査 statsDataId 候補)
- [ ] OECD 比較 (`gender-wage-international`) は別取得経路 (OECD Stats API or CSV)。新規スキル化候補
- [ ] 上下位 5 県バーは独立 chart_type か、choropleth コンポーネントの補助 UI か (frontend 設計判断、living-housing.md と統一する)

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- 見本: [`living-housing.md`](./living-housing.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/labor-wages.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-d1-migration.md`

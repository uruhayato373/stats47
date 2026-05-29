---
type: theme-chart-planning
date: 2026-05-26
theme_key: education-culture
status: drafted
research_sources:
  - https://www.mext.go.jp/b_menu/toukei/chousa01/kihon/1267995.htm
  - https://www.e-stat.go.jp/stat-search/database?statdisp_id=0003066046
  - https://education-career.jp/magazine/data-report/2025/ranking-achievement-test-2024/
  - https://uub.jp/pdr/e/aaa_7b.html
  - https://reseed.resemom.jp/article/2025/06/03/11008.html
  - https://nlab.itmedia.co.jp/research/articles/274843/
tags: [theme-charts, education-culture]
---

# 教育・文化 (education-culture) — チャート構成設計

## 0. 結論サマリ

左コロプレスで「人口 100 万人あたり図書館数」(2021 年最新) を地図表示、右に **(A) 全国推移ライン (大学等進学率 1955→2024 で 10%→59.1% 過去最高)**、**(B) 学校種別構成パイ (小中高の学校数構成)**、**(C) 上下位 5 県バー (図書館数: 山梨 65.8 vs 神奈川 5.8)** を縦に積む。学校タブには学力テスト全国推移、文化施設タブには公民館数の地域偏りを補強する。

## 1. 既存 metric 棚卸し

| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |
|---|---|---|---|---|---|---|
| `library-count-per-million` | 図書館 | primary | 文化施設 | choropleth + line + bar | prefecture / national | 社会教育調査 (3 年ごと, 最新 2021) |
| `elementary-school-count-per-100km2-habitable` | 小学校 | secondary | 学校 | choropleth + line | prefecture / national | 学校基本調査 (年次, 最新 2024) |
| `junior-high-school-count-per-100km2-habitable` | 中学校 | secondary | 学校 | choropleth + line | prefecture / national | 同上 |
| `high-school-count-per-100km2-habitable` | 高等学校 | secondary | 学校 | choropleth + line | prefecture / national | 同上 |
| `public-hall-count-per-million` | 公民館 | secondary | 文化施設 | choropleth + bar | prefecture | 社会教育調査 (3 年ごと) |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `library-count-per-million` (人口 100 万人あたり図書館数, 2021 年)

- 配色: 緑系の発散カラースケール (多いほど濃緑、全国平均を白)
- ホバー時: 県名 + 図書館数 + 全国順位

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 全国推移ライン

**何を見せるか**: 大学等進学率の全国推移 (1955-2024)

- データ源: 文部科学省 学校基本調査 (年次)
- curiosity gap: **「1955 年 10.1% → 2024 年 59.1% で過去最高、しかし地域格差は東京 77% vs 秋田 40% で約 2 倍」** をタイトルで打ち出す
- 必要データ: `app/themes/education-culture/timeseries/university-enrollment-rate.json`
  ```json
  { "metricKey": "university-enrollment-rate", "scope": "national",
    "unit": "%", "series": [{ "year": 1955, "value": 10.1 }, ..., { "year": 2024, "value": 59.1 }] }
  ```

#### (B) 学校種別構成パイチャート

**何を見せるか**: 全国の学校数 (小・中・高) の **構成比**

| 学校種 | 全国校数 (2024) | 割合 |
|---|---|---|
| 小学校 | 約 18,800 校 | 47% |
| 中学校 | 約 9,900 校 | 25% |
| 高等学校 | 約 4,700 校 | 12% |
| その他 (幼稚園/特支/大学等) | 約 6,400 校 | 16% |

- データ源: 学校基本調査 (学校種別総覧)
- 必要データ: `app/themes/education-culture/breakdown/school-types.json`
  ```json
  { "metricKey": "school-count", "breakdown_dimension": "学校種",
    "year": 2024, "items": [{ "label": "小学校", "value": 18800, "ratio": 0.47 }, ...] }
  ```
- 都道府県切替トグル付き (デフォルト全国)

#### (C) 上下位 5 県バーチャート

**何を見せるか**: 人口 100 万人あたり図書館数 TOP 5 + BOTTOM 5 (2021)

```
山梨県   65.8 ▰▰▰▰▰▰▰▰▰▰▰▰
島根県   61.7 ▰▰▰▰▰▰▰▰▰▰▰
長野県   59.0 ▰▰▰▰▰▰▰▰▰▰
富山県   約45 ▰▰▰▰▰▰▰▰
岐阜県   約43 ▰▰▰▰▰▰▰▰
─ 全国平均 約26 ─
大阪府   約10 ▰▰
埼玉県    約9 ▰▰
愛知県    約8 ▰▰
東京都    約7 ▰
神奈川県  約6 ▰
```

- choropleth と同じ `app/ranking/library-count-per-million/values.json` から派生
- 別途 export 不要

### 2-3. パネルタブ — 既存維持 + 補助チャート追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **学校** | elementary / junior-high / high-school (per 100km²) | line: 小中学校数の全国推移 (少子化で 1985→2024 で小学校 25,000→18,800 校に減少)<br>line: 大学等進学率推移 (1955→2024 で 10%→59.1%) |
| **文化施設** | library / public-hall (per million) | bar: 図書館数 vs 公民館数の都市部 (東京/神奈川) vs 地方 (山梨/島根) 対比<br>line: 公民館数の全国推移 (1970 ピーク 約 19,000 館 → 2021 約 13,800 館で 30 年減少) |
| **考察** | (空) | (現状通り) |

## 3. 参考にしたサイト (リサーチ結果)

- [文部科学省: 学校基本調査](https://www.mext.go.jp/b_menu/toukei/chousa01/kihon/1267995.htm) — 公式の年次統計。大学進学率 / 学校数 / 在学者数の都道府県別データ源
- [e-Stat: 学校基本調査 都道府県別 大学・短期大学等への進学者数](https://www.e-stat.go.jp/stat-search/database?statdisp_id=0003066046) — 進学率 timeseries の primary source
- [education-career.jp: 2024 年度全国学力テスト 都道府県別正答率ランキング](https://education-career.jp/magazine/data-report/2025/ranking-achievement-test-2024/) — 学力テスト県別 TOP/BOTTOM 5 の具体数値。秋田・石川・福井が常連、沖縄が下位の構図
- [uub.jp: 全国学力学習状況調査ランキング](https://uub.jp/pdr/e/aaa_7b.html) — 過去年度推移と公立校限定の集計方針を確認
- [リシード: 自県の大学進学率、愛知 7 割超で全国トップ](https://reseed.resemom.jp/article/2025/06/03/11008.html) — 自県進学率の curiosity gap (愛知 72% vs 奈良 15%) を参考
- [ねとらぼリサーチ: 図書館の多い都道府県ランキング 1 位 山梨県](https://nlab.itmedia.co.jp/research/articles/274843/) — 図書館数 TOP の意外性 (山梨 65.8) を curiosity gap として表現する手法

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (national) | `university-enrollment-rate` | 1955-2024 (年次) | `app/themes/education-culture/timeseries/university-enrollment-rate.json` | 学校基本調査 |
| timeseries (national) | `elementary-school-count-per-100km2-habitable` | 1985-2024 | `app/themes/education-culture/timeseries/elementary-school-count.json` | 同上 |
| timeseries (national) | `library-count-per-million` | 1987-2021 (3 年ごと) | `app/themes/education-culture/timeseries/library-count.json` | 社会教育調査 |
| timeseries (national) | `public-hall-count-per-million` | 1970-2021 | `app/themes/education-culture/timeseries/public-hall-count.json` | 同上 |
| breakdown (pie) | `school-count` | 2024 | `app/themes/education-culture/breakdown/school-types.json` | 学校基本調査 学校種別総覧 |

**統合 JSON 案**: `app/themes/education-culture/charts.json` 1 ファイルにまとめる方が fetch 回数が減る (living-housing と同方針)。

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `university-enrollment-rate` (大学等進学率) | **最強の curiosity gap**: 東京 77.6% vs 秋田/宮崎 40.1% で 2 倍格差。地方の教育機会不平等を可視化 | e-Stat 学校基本調査 statsDataId: 0003066046 |
| `national-achievement-test-elementary-japanese` (全国学力テスト 小学校国語 正答率) | 秋田・石川・福井が常連 TOP、沖縄が下位の構造的パターン | 文科省 全国学力・学習状況調査 |
| `national-achievement-test-junior-math` (中学校数学 正答率) | 沖縄 43% vs 石川 57% という curiosity gap | 同上 |
| `self-prefecture-university-enrollment-ratio` (自県大学進学率) | 愛知 72% vs 奈良 15% (大学密度との関連) | 文科省 各都道府県における高等教育の現状調査 |

**大学等進学率は最優先で追加候補**。47 都道府県格差が 2 倍と大きく、SEO 検索ボリュームも高い。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実 (`.claude/rules/blog-quality-standards.md` 準拠):

1. **「大学進学率 東京 77% vs 秋田 40%、なぜ 2 倍の地域格差?」** — 倍率 + 疑問形
2. **「図書館数 1 位は意外にも山梨県、東京・神奈川は下位グループ」** — 意外性 + 逆説 (都市部の方が少ない)
3. **「学力テスト常連 1 位は秋田・石川・福井、唯一の北陸+東北パターン」** — 構造的真因
4. **「公民館は 1970 年 19,000 館 → 2021 年 13,800 館、なぜ減ったのか?」** — 時系列 + 疑問

theme description (D1 themes.description) を以下に書き換え推奨:

> 「大学進学率は東京 77% vs 秋田 40% で 2 倍格差──図書館数 1 位は山梨 65.8 館、学力テスト常連は秋田・石川・福井。47 都道府県の教育・文化施設を地図とランキングで比較。」

## 7. 残課題 / 要検証

- [ ] `university-enrollment-rate` を新規 metric として D1 に追加するか (statsDataId: 0003066046, 1955-2024 timeseries 取得可能か `/inspect-estat-meta` で確認)
- [ ] 全国学力テスト正答率は e-Stat で取得できるか (文科省サイト直接 CSV download が必要な可能性)
- [ ] 「学校種別」breakdown は学校基本調査の cdCat で取得できるか (`/inspect-estat-meta` で確認)
- [ ] 公民館数の長期推移 (1970-2021) は社会教育調査の各年度 statsDataId を集約する必要あり
- [ ] 図書館数 TOP/BOTTOM の数値は人口当たり vs 絶対数で順位が大きく変わる (`library-count-per-million` 統一でよいか UI 確認)

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- 見本: [`living-housing.md`](./living-housing.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/education-culture.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-plan.md`

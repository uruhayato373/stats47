---
type: theme-chart-planning
date: 2026-05-26
theme_key: population-dynamics
status: drafted
research_sources:
  - https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/kakutei24/index.html
  - https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/suii09/brth4.html
  - https://www.nippon.com/ja/japan-data/h02503/
  - https://www.nippon.com/ja/japan-data/h02697/
  - https://www.ipss.go.jp/pp-zenkoku/j/zenkoku2023/pp2023_gaiyou.pdf
  - https://dashboard.e-stat.go.jp/pyramidGraph?screenCode=00570&regionCode=00000&pyramidAreaType=2
tags: [theme-charts, population-dynamics]
---

# 人口動態 (population-dynamics) — チャート構成設計

## 0. 結論サマリ

左コロプレスで「合計特殊出生率」(2024 年最新) を地図表示、右に **(A) 全国推移ライン (1975→2024 で 1.91→1.15、過去最低を毎年更新)**、**(B) 年齢階級別人口ピラミッド bar (5 歳階級・男女別、2024 vs 2050 推計の重ね描き)**、**(C) 上下位 5 県バー (沖縄 1.54 / 福井 1.46 vs 東京 0.96 / 宮城 1.00)** の 3 枚を縦に積む。「出生・死亡」「移動」「構造」パネルタブはそれぞれ全国推移ラインを追加し、特に「移動」タブには東京圏転入超過の時系列を入れる。

## 1. 既存 metric 棚卸し

| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |
|---|---|---|---|---|---|---|
| `crude-birth-rate` | 粗出生率 | primary | 出生・死亡 | choropleth + line | prefecture / national | 人口動態統計 (年次, 1947-2024) |
| `total-fertility-rate` | 合計特殊出生率 | secondary | 出生・死亡 | choropleth + line + bar | prefecture / national | 人口動態統計 (年次) |
| `crude-death-rate` | 死亡率 | secondary | 出生・死亡 | choropleth + line | prefecture / national | 同上 |
| `natural-increase-rate` | 自然増減率 | secondary | 出生・死亡 | choropleth + line | prefecture / national | 同上 (2007 から全国マイナス) |
| `social-increase-rate` | 社会増減率 | secondary | 移動 | choropleth + line | prefecture / national | 住民基本台帳人口移動報告 |
| `moving-in-excess-rate` | 転入超過率 | secondary | 移動 | choropleth + bar | prefecture | 同上 (東京圏のみプラス常態) |
| `ratio-65-plus` | 高齢化率 | secondary | 構造 | choropleth + line | prefecture / national | 国勢調査 / 推計人口 |
| `young-population-ratio` | 年少人口割合 | secondary | 構造 | choropleth + line | prefecture / national | 同上 |
| `population-density-per-km2-inhabitable-area` | 人口密度 | secondary | 構造 | choropleth + bar | prefecture | 国勢調査 + 国土地理院 |
| `day-time-population-ratio` | 昼夜間人口比率 | secondary | 移動 | choropleth | prefecture | 国勢調査 (5年ごと) |
| `total-population` | 総人口 | context | 構造 | choropleth + line | prefecture / national | 住民基本台帳 / 国勢調査 |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `total-fertility-rate` (合計特殊出生率, 2024 年)

- 配色: 発散カラースケール (高いほど青、全国平均 1.15 を白、低いほど赤)
- ホバー時: 県名 + TFR + 全国順位 + 出生数
- 「東京 0.96 (全国で唯一の 1 切れ)」を凡例で強調

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 全国推移ライン

**何を見せるか**: 全国 TFR + 粗出生率の推移 (1975-2024, 年次 50 ポイント)

- データ源: 厚労省「人口動態統計」全国集計
- curiosity gap: **「1975 年 1.91 → 2024 年 1.15、出生数は統計史上初めて 70 万人割れ (68.6 万)」**
- 必要データ: `app/themes/population-dynamics/timeseries/total-fertility-rate.json`
  ```json
  { "metricKey": "total-fertility-rate", "scope": "national",
    "unit": "", "series": [{ "year": 1975, "value": 1.91 }, ..., { "year": 2024, "value": 1.15 }] }
  ```

#### (B) 人口ピラミッド (年齢階級別 bar)

**何を見せるか**: 5 歳階級 × 男女別の人口構成、2024 実績と 2050 IPSS 推計を重ねる

| 年齢階級 | 2024 男性 (万人) | 2024 女性 (万人) | 2050 男性 (推計) | 2050 女性 (推計) |
|---|---|---|---|---|
| 0-4 | 213 | 203 | 約 165 | 約 157 |
| 20-24 | 311 | 296 | 約 245 | 約 232 |
| 40-44 | 397 | 384 | 約 290 | 約 277 |
| 65-69 | 401 | 419 | 約 350 | 約 370 |
| 85+ | 245 | 502 | 約 530 | 約 880 |

- データ源: 統計局推計人口 + IPSS「日本の将来推計人口 (令和5年推計)」
- curiosity gap: **「85+ 女性が 2024 の 502 万から 2050 に 880 万へ 1.75 倍、20 代女性は 296 → 232 万へ縮小」**
- 必要データ: `app/themes/population-dynamics/breakdown/population-pyramid.json`
  ```json
  { "metricKey": "total-population", "breakdown_dimension": "age-sex",
    "year": 2024, "items": [{ "ageBand": "0-4", "male": 2130000, "female": 2030000 }, ...],
    "projection2050": [{ "ageBand": "0-4", "male": 1650000, "female": 1570000 }, ...] }
  ```
- 都道府県切替トグル付き (デフォルト全国)

#### (C) 上下位 5 県バーチャート

**何を見せるか**: TFR TOP 5 + BOTTOM 5 (2024)

```
沖縄県 1.54 ▰▰▰▰▰▰▰▰▰▰▰▰▰▰
福井県 1.46 ▰▰▰▰▰▰▰▰▰▰▰▰▰
鳥取県 1.43 ▰▰▰▰▰▰▰▰▰▰▰▰▰
島根県 1.43 ▰▰▰▰▰▰▰▰▰▰▰▰▰
宮崎県 1.43 ▰▰▰▰▰▰▰▰▰▰▰▰▰
─ 全国平均 1.15 ─
京都府 1.07 ▰▰▰▰▰▰▰▰▰▰
北海道 1.01 ▰▰▰▰▰▰▰▰▰
宮城県 1.00 ▰▰▰▰▰▰▰▰▰
東京都 0.96 ▰▰▰▰▰▰▰▰▰
```

- `app/ranking/total-fertility-rate/values.json` から派生 (別 export 不要)

### 2-3. パネルタブ — 既存維持 + 補助チャート追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **出生・死亡** | crude-birth-rate / total-fertility-rate / crude-death-rate / natural-increase-rate | line: 出生数 vs 死亡数の全国推移 (出生 68 万 vs 死亡 159 万、自然減 91 万人=過去最大)<br>line: TFR の 50 年推移 |
| **移動** | social-increase-rate / moving-in-excess-rate / day-time-population-ratio | line: 東京圏 4 都県の転入超過数推移 (2024 約 13.6 万 vs コロナ底 8 万)<br>bar: 2024 転入超過上位下位 5 県 (東京 +6.5 万 vs 広島 -1.2 万) |
| **構造** | ratio-65-plus / young-population-ratio / population-density / total-population | line: 高齢化率と年少人口割合の全国推移 (1975→2024 でクロス)<br>line: 総人口の 1950-2024 推移 + 2050 推計接続 (約 1.04 億人へ) |
| **考察** | (空) | 本文記事用 |

## 3. 参考にしたサイト (リサーチ結果)

- [厚労省: 令和6年(2024) 人口動態統計（確定数）の概況](https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/kakutei24/index.html) — TFR 1.15、出生数 68.6 万の一次ソース。県別ランキング数値の根拠
- [厚労省: 都道府県別にみた合計特殊出生率の年次推移](https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/suii09/brth4.html) — 都道府県 × 年次の長期マトリクス。time series exporter の元データ
- [Nippon.com: 日本人、過去最大の 90 万人減](https://www.nippon.com/ja/japan-data/h02503/) — curiosity gap 表現の参考。「全都道府県で日本人減」「外国人 299 万人で過去最多」の対比構造
- [Nippon.com: 東京都への転入超過 6.5 万人](https://www.nippon.com/ja/japan-data/h02697/) — 移動タブの東京一極集中チャート構成参考
- [IPSS: 日本の将来推計人口（令和5年推計）概要](https://www.ipss.go.jp/pp-zenkoku/j/zenkoku2023/pp2023_gaiyou.pdf) — 2050 推計値（人口ピラミッド B チャート重ね描き用）
- [統計ダッシュボード: 人口ピラミッド](https://dashboard.e-stat.go.jp/pyramidGraph?screenCode=00570&regionCode=00000&pyramidAreaType=2) — 公式ピラミッドのレイアウト参考（男女左右対称 horizontal bar）

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (national) | `total-fertility-rate` | 1947-2024 (年次) | `app/themes/population-dynamics/timeseries/total-fertility-rate.json` | 人口動態統計 (statsDataId: 0003411595 系) |
| timeseries (national) | `crude-birth-rate` | 1947-2024 | `app/themes/population-dynamics/timeseries/crude-birth-rate.json` | 同上 |
| timeseries (national) | `crude-death-rate` | 1947-2024 | `app/themes/population-dynamics/timeseries/crude-death-rate.json` | 同上 |
| timeseries (national) | `natural-increase-rate` | 1947-2024 | `app/themes/population-dynamics/timeseries/natural-increase-rate.json` | 同上 |
| timeseries (national) | `total-population` | 1950-2024 | `app/themes/population-dynamics/timeseries/total-population.json` | 国勢調査 + 推計人口 |
| timeseries (national) | `ratio-65-plus` + `young-population-ratio` | 1975-2024 | `app/themes/population-dynamics/timeseries/age-structure.json` | 国勢調査 / 推計人口 |
| timeseries (regional) | `moving-in-excess-rate` (東京圏 4 都県集計) | 2000-2024 | `app/themes/population-dynamics/timeseries/tokyo-metro-migration.json` | 住民基本台帳人口移動報告 |
| breakdown (pyramid) | `total-population` | 2024 + 2050 推計 | `app/themes/population-dynamics/breakdown/population-pyramid.json` | 推計人口 (5歳階級・男女別) + IPSS 推計 |

**統合 JSON 案** (`app/themes/population-dynamics/charts.json` 1 ファイル):

```json
{
  "themeKey": "population-dynamics",
  "timeseries": {
    "total-fertility-rate": { "scope": "national", "unit": "", "series": [...] },
    "tokyo-metro-migration": { "scope": "regional", "unit": "人", "series": [...] }
  },
  "breakdown": {
    "population-pyramid": { "label": "年齢5歳階級×男女", "year": 2024, "items": [...], "projection2050": [...] }
  }
}
```

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `births-count` (出生数 実数) | 「68 万人割れ・統計史上初」インパクトを率ではなく実数で訴求 | 人口動態統計 (statsDataId: 0003411595) |
| `population-change-rate-japanese-only` | 日本人住民のみで見た増減率。沖縄も含む全 47 県マイナスを可視化 (外国人を除外した「縮む日本」像) | 住民基本台帳 (日本人/外国人別) |
| `projected-population-2050-ratio` (2050 人口比 = 2050推計 / 2020) | 秋田 0.58、奈良 0.71 など「30 年後に半減する県」を地図化 | IPSS 地域別将来推計 (令和5年推計) |

特に `projected-population-2050-ratio` は **将来推計を地図化する独自性** が強く、メディア引用されやすい。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実 (`.claude/rules/blog-quality-standards.md` 準拠):

1. **「合計特殊出生率 1.15 で過去最低、出生数は統計開始以来初の 70 万人割れ」** — 二重の「初」で衝撃
2. **「東京 0.96 vs 沖縄 1.54、なぜ東京だけ 1 を切ったのか?」** — 疑問形 + 唯一性
3. **「47 都道府県すべてで日本人人口が減ったのに、外国人は 299 万人で過去最多」** — 逆説的対比
4. **「2050 年に秋田は人口が今の 58% へ──30 年で 4 割が消える県」** — 将来推計の意外性

theme description (D1 themes.description) 書き換え推奨:

> 「合計特殊出生率 1.15 で過去最低、出生数は初の 70 万人割れ。東京 0.96 vs 沖縄 1.54、東京圏は転入超過 13 万人で一極集中続く。47 都道府県の出生・死亡・移動・年齢構造を地図と人口ピラミッドで比較。」

## 7. 残課題 / 要検証

- [ ] `total-fertility-rate` の e-Stat statsDataId が 1947 から 2024 まで連続取得できるか確認 (戦後初期は調査体系が異なる)
- [ ] 人口ピラミッド (5 歳階級 × 男女) の最新値が D1 / e-Stat にあるか、または別途 export 必要か (`/inspect-estat-meta` で確認)
- [ ] IPSS 「日本の地域別将来推計人口 (令和5年推計)」は e-Stat 経由では取得できない可能性大 → IPSS サイトから CSV download スキル新設候補
- [ ] 「東京圏転入超過」は 4 都県の合算が必要。集計ロジックを exporter 側に組み込むか事前計算するか
- [ ] `births-count` を primary に格上げするか secondary 据え置きか (率と実数の双方を見せる場合のレイアウト判断)

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- 見本: [`living-housing.md`](./living-housing.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/population-dynamics.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-d1-migration.md`

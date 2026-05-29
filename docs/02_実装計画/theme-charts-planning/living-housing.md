---
type: theme-chart-planning
date: 2026-05-26
theme_key: living-housing
status: drafted
research_sources:
  - https://www.stat.go.jp/data/jyutaku/2023/tyousake.html
  - https://www.stat.go.jp/viz/jyutaku/index.html
  - https://www.nippon.com/ja/japan-data/h01987/
  - https://www.nippon.com/en/japan-data/h02059/
  - https://www.nippon.com/en/japan-data/h02201/
  - https://www.stat.go.jp/data/jyutaku/2023/pdf/kihon_gaiyou.pdf
tags: [theme-charts, living-housing, 見本]
---

# 暮らし・住まい (living-housing) — チャート構成設計

> **本ファイルは 17 テーマ展開の見本** (`docs/02_実装計画/theme-charts-planning/README.md` 参照)。
> Phase 3 で line/pie 用 exporter を作る際の入力仕様。

## 0. 結論サマリ

左コロプレスで「空き家率」(2023 年最新) を地図表示、右に **(A) 全国推移ライン (1968→2023 で空き家率が 5%→13.8% に急上昇)**、**(B) 空き家種類別パイ (賃貸用/二次的/その他)**、**(C) 上下位 5 県バー (和歌山/徳島 21.2% vs 沖縄 9.7%)** の 3 枚を縦に積む。住宅・世帯・人口/婚姻のパネルタブはそれぞれ「全国推移ライン」を追加する。

## 1. 既存 metric 棚卸し

| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |
|---|---|---|---|---|---|---|
| `vacant-housing-ratio` | 空き家率 | primary | 住宅 | choropleth + line + bar | prefecture / national | 住宅・土地統計調査 (5年ごと, 1968-2023) |
| `owner-occupied-housing-ratio` | 持ち家率 | secondary | 住宅 | choropleth + line | prefecture / national | 同上 |
| `dwelling-per-floor-area` | 延べ面積 | secondary | 住宅 | choropleth + bar | prefecture | 同上 |
| `households` | 世帯数 | context | 世帯 | choropleth + line | prefecture / national | 国勢調査 (5年ごと) |
| `nuclear-family-households-ratio` | 核家族世帯率 | context | 世帯 | choropleth + line | prefecture / national | 同上 |
| `elderly-couple-only-household-ratio` | 高齢夫婦世帯 | secondary | 世帯 | choropleth | prefecture | 同上 |
| `single-person-household-old-population-ratio` | 高齢単身世帯率 | context | 世帯 | choropleth + line | prefecture / national | 同上 (1in3 が単身世帯) |
| `population-density-per-km2-inhabitable-area` | 人口密度 | secondary | 人口・婚姻 | choropleth + bar | prefecture | 国勢調査 |
| `habitable-area-ratio` | 可住地面積割合 | context | 人口・婚姻 | choropleth | prefecture | 国土地理院 |
| `densely-inhabited-district-population-density` | DID人口密度 | context | 人口・婚姻 | choropleth | prefecture | 国勢調査 DID 集計 |
| `ratio-never-married-15-plus` | 未婚率 | secondary | 人口・婚姻 | choropleth + line | prefecture / national | 国勢調査 |
| `marriages` | 婚姻件数 | context | 人口・婚姻 | choropleth + line | prefecture / national | 人口動態調査 (年次) |
| `divorces` | 離婚件数 | context | 人口・婚姻 | choropleth + line | prefecture / national | 同上 |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `vacant-housing-ratio` (空き家率, 2023 年)

- 最新年データは 2023 (令和 5 年住宅・土地統計調査)
- 配色: 赤系の発散カラースケール (高いほど赤、全国平均 13.8% を白)
- ホバー時: 県名 + 空き家率 + 全国順位

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 全国推移ライン

**何を見せるか**: 全国の空き家率推移 (1968-2023, 5 年ごとの 12 ポイント)

- データ源: e-Stat 住宅・土地統計調査の全国集計値
- curiosity gap: **「5.5% (1968) → 13.8% (2023)、過去最高」** をタイトルで打ち出す
- 必要データ: `app/themes/living-housing/timeseries/vacant-housing-ratio.json`
  ```json
  { "metricKey": "vacant-housing-ratio", "scope": "national",
    "unit": "%", "series": [{ "year": 1968, "value": 5.5 }, ..., { "year": 2023, "value": 13.8 }] }
  ```

#### (B) 空き家種類別パイチャート

**何を見せるか**: 空き家 900 万戸の **内訳** (4 区分)

| 区分 | 戸数 | 割合 | 注目度 |
|---|---|---|---|
| 賃貸用空き家 | 約 443 万戸 | 49% | 一般的に流通中 |
| 二次的住宅 (別荘等) | 約 38 万戸 | 4% | 一部地域に偏在 |
| 売却用空き家 | 約 33 万戸 | 4% | - |
| **その他空き家** | **約 385 万戸** | **43%** | **政策上の問題児** (放置住宅) |

- データ源: e-Stat `statsDataId` (住宅・土地統計調査 住宅及び世帯に関する基本集計、空き家種類別)
- 必要データ: `app/themes/living-housing/breakdown/vacant-housing-types.json`
  ```json
  { "metricKey": "vacant-housing-ratio", "breakdown_dimension": "空き家種類",
    "year": 2023, "items": [{ "label": "賃貸用", "value": 4430000, "ratio": 0.49 }, ...] }
  ```
- 都道府県切替トグル付き (デフォルト全国、選択で県別内訳)

#### (C) 上下位 5 県バーチャート

**何を見せるか**: 空き家率 TOP 5 + BOTTOM 5

```
和歌山県 21.2% ▰▰▰▰▰▰▰▰▰▰▰
徳島県   21.2% ▰▰▰▰▰▰▰▰▰▰▰
山梨県   20.5% ▰▰▰▰▰▰▰▰▰▰
鹿児島県 20.4% ▰▰▰▰▰▰▰▰▰▰
高知県   20.3% ▰▰▰▰▰▰▰▰▰▰
─ 全国平均 13.8% ─
山形県   12.0% ▰▰▰▰▰▰
東京都   11.0% ▰▰▰▰▰
神奈川県 10.6% ▰▰▰▰▰
埼玉県   10.2% ▰▰▰▰▰
沖縄県    9.7% ▰▰▰▰▰
```

- choropleth と同じ `app/ranking/vacant-housing-ratio/values.json` (prefecture, Phase 2 で snapshot 化) から派生
- 別途 export 不要

### 2-3. パネルタブ — 既存維持 + 補助チャート追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **住宅** | vacant-housing-ratio / owner-occupied-housing-ratio / dwelling-per-floor-area | line: 持ち家率 vs 借家率の全国推移 (1968→2023、持ち家率は 60% → 61% でほぼ横ばい、と意外性) |
| **世帯** | households / nuclear-family / elderly-couple / single-person-elderly | pie: 世帯類型別構成 (全国 単独 38% / 核家族 56% / その他 6%, 2020 census)<br>line: 単独世帯率の全国推移 (1980→2020 で 20% → 38%) |
| **人口・婚姻** | population-density / habitable-area-ratio / DID-density / never-married / marriages / divorces | line: 婚姻件数の全国推移 (戦後ピーク 110万件 → 2023年 47万件で半減超)<br>line: 未婚率の全国推移 (1980→2020) |
| **考察** | (空) | (現状通り、本文記事用) |

## 3. 参考にしたサイト (リサーチ結果)

- [統計局: 令和5年住宅・土地統計調査 調査の結果](https://www.stat.go.jp/data/jyutaku/2023/tyousake.html) — 公式の代表チャート構成。年次推移ラインと県別ランキング棒グラフを並べるパターン
- [統計Viz/住宅・土地統計調査](https://www.stat.go.jp/viz/jyutaku/index.html) — 住宅数と空き家率のビジュアライズ専用ページ。地図 + 時系列の左右レイアウト
- [Nippon.com: Number of Vacant Homes in Japan Reaches Record 9 Million](https://www.nippon.com/en/japan-data/h01987/) — 「9 million vacant houses」を curiosity gap として打ち出す典型例。本論記事のサムネ案に流用可
- [Nippon.com: One in Three Japanese Households Consist of Just One Person](https://www.nippon.com/en/japan-data/h02059/) — 単独世帯 38% を「1 in 3」と表現してインパクトを出す手法
- [Nippon.com: Single Elderly to Be 20% of Japanese Households by 2050](https://www.nippon.com/en/japan-data/h02201/) — 将来推計を交えた構成提案 (Phase 3+ で IPSS 推計データを追加候補)
- [統計局 PDF: 令和5年住宅・土地統計調査 基本集計結果概要](https://www.stat.go.jp/data/jyutaku/2023/pdf/kihon_gaiyou.pdf) — 公式チャート (空き家種類別構成のパイチャート、都道府県別棒グラフ)。レイアウトはほぼこのまま参考に

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (national) | `vacant-housing-ratio` | 1968-2023 (12 点) | `app/themes/living-housing/timeseries/vacant-housing-ratio.json` | 住宅・土地統計調査 全国集計 |
| timeseries (national) | `owner-occupied-housing-ratio` | 1968-2023 | `app/themes/living-housing/timeseries/owner-occupied-housing-ratio.json` | 同上 |
| timeseries (national) | `marriages` | 1947-2023 (年次) | `app/themes/living-housing/timeseries/marriages.json` | 人口動態統計 |
| timeseries (national) | `single-person-household-old-population-ratio` | 1980-2020 (5年ごと) | `app/themes/living-housing/timeseries/single-person-elderly.json` | 国勢調査 |
| timeseries (national) | `ratio-never-married-15-plus` | 1980-2020 | `app/themes/living-housing/timeseries/never-married.json` | 国勢調査 |
| breakdown (pie) | `vacant-housing-ratio` | 2023 | `app/themes/living-housing/breakdown/vacant-housing-types.json` | 住宅・土地統計調査 空き家種類別 |
| breakdown (pie) | `households` | 2020 | `app/themes/living-housing/breakdown/household-types.json` | 国勢調査 世帯類型別 |

**統合 JSON 案** (1 fetch で複数 chart データを取れる構成):

```json
{
  "themeKey": "living-housing",
  "timeseries": {
    "vacant-housing-ratio": { "scope": "national", "unit": "%", "series": [...] },
    "owner-occupied-housing-ratio": { ... },
    "marriages": { ... }
  },
  "breakdown": {
    "vacant-housing-types": { "label": "空き家種類", "items": [...] },
    "household-types": { "label": "世帯類型", "items": [...] }
  }
}
```

→ `app/themes/living-housing/charts.json` 1 ファイルにまとめる方が fetch 回数が減って fast。Phase 3 設計時に判断。

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `other-vacant-housing-ratio` (放置空き家率) | 「その他空き家」=政策上問題視される放置住宅。地方ほど高い (鹿児島 13.6%, 高知 12.9%) という意外性 | e-Stat 住宅・土地統計調査 (statsDataId: 0004021631 ベース) |
| `secondary-dwelling-ratio` (別荘比率) | 別荘多い県 = 山梨/長野/静岡 の典型パターンを地図化できる | 同上 |
| `housing-projection-2050-single-elderly` | IPSS 将来推計の単身高齢世帯予測 (2050 年 20%) | 国立社会保障・人口問題研究所「日本の世帯数の将来推計」 |

放置空き家率は **特に強い curiosity gap** を作れるので最優先で追加候補。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実 (`.claude/rules/blog-quality-standards.md` 準拠):

1. **「過去最高 13.8%、放置空き家は 4 軒に 1 軒」** — 数値 + 換算で衝撃を出す
2. **「和歌山と徳島が同率 21.2% で全国トップ、なぜ西日本に多い?」** — 疑問形 + 地域偏り
3. **「持ち家率は 60% で 1968 年からほぼ横ばい、変わったのは空き家の方」** — 逆説 (「家を持つ人」より「空く家」が増えた)
4. **「東京の世帯の半分は 1 人暮らし (50.2%)、全国平均 38%」** — 比較 + 倍率

theme description (D1 themes.description) を以下に書き換え推奨:

> 「2023 年に空き家が 900 万戸・空き家率 13.8% で過去最高──和歌山と徳島は 21.2%、東京の 1 人暮らし世帯率は 50%。47 都道府県の住宅・世帯構造を地図とランキングで比較。」

## 7. 残課題 / 要検証

- [ ] `vacant-housing-ratio` の e-Stat statsDataId が時系列全件 (1968-2023) 取得できるか確認 (5 年ごとに調査年度コードが変わるため)
- [ ] 「空き家種類別」内訳は `cdCat01` 等のカテゴリ次元で取れるか、それとも別 statsDataId か (住宅・土地統計調査の cdCat 構造を `/inspect-estat-meta` で確認)
- [ ] `single-person-household-old-population-ratio` の「単独世帯総数 (全年齢)」も別途欲しい (世帯類型 pie のソース)
- [ ] IPSS 将来推計データは e-Stat には無いため、別の取得経路 (CSV download) が必要 → 新規スキル化候補
- [ ] 上下位 5 県バーは独立 chart_type か、それとも choropleth コンポーネントの補助 UI として実装するか (frontend 設計判断)

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/living-housing.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-plan.md`

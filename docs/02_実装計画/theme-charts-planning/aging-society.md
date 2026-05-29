---
type: theme-chart-planning
date: 2026-05-26
theme_key: aging-society
status: drafted
research_sources:
  - https://www8.cao.go.jp/kourei/whitepaper/w-2025/zenbun/pdf/1s1s_01.pdf
  - https://www8.cao.go.jp/kourei/whitepaper/w-2024/html/zenbun/s1_1_4.html
  - https://www.stat.go.jp/data/topics/pdf/topics146.pdf
  - https://www.stat.go.jp/data/jinsui/2024np/index.html
  - https://gemmed.ghc-j.com/?p=61052
  - https://www.heartpage.jp/contents/magazine/08-00145
tags: [theme-charts, aging-society]
---

# 少子高齢化 (aging-society) — チャート構成設計

## 0. 結論サマリ

左コロプレスで「高齢化率」(2024 年 29.3% 過去最高、`ratio-65-plus`) を地図表示、右に **(A) 全国推移ライン (1950 年 4.9% → 2024 年 29.3% → 2050 年 38.7% で 8 倍化)**、**(B) 年齢 3 区分パイ (0-14 / 15-64 / 65+、65+ の中でも 75+ が 16.8% で過去最高)**、**(C) 上下位 5 県バー (秋田 39.5% vs 東京 22.8%)** の 3 枚を縦に積む。出生・婚姻/人口動態タブには出生率ライン (1.20 で過去最低) と社会増減率バー (東京一極集中) を追加。

## 1. 既存 metric 棚卸し

| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |
|---|---|---|---|---|---|---|
| `ratio-65-plus` | 高齢化率 | primary | 高齢化 | choropleth + line + bar | prefecture / national | 人口推計 (年次, 1950-2024 + 将来推計 2050) |
| `aging-index` | 老年化指数 | secondary | 高齢化 | choropleth + line | prefecture / national | 国勢調査・人口推計 |
| `dependent-population-index` | 従属人口指数 | secondary | 高齢化 | choropleth | prefecture | 国勢調査 |
| `household-ratio-with-65plus` | 65歳以上世帯割合 | context | 高齢化 | choropleth | prefecture | 国勢調査 (5 年ごと) |
| `total-fertility-rate` | 合計特殊出生率 | secondary | 出生・婚姻 | choropleth + line + bar | prefecture / national | 人口動態統計 (年次, 1947-2024) |
| `crude-birth-rate` | 粗出生率 | secondary | 出生・婚姻 | choropleth + line | prefecture / national | 人口動態統計 |
| `average-age-of-first-marriage-wife` | 初婚年齢(妻) | context | 出生・婚姻 | choropleth + line | prefecture / national | 同上 |
| `population-growth-rate` | 人口増減率 | secondary | 人口動態 | choropleth + line | prefecture / national | 人口推計 |
| `natural-increase-rate` | 自然増減率 | secondary | 人口動態 | choropleth + line | prefecture / national | 人口動態統計 |
| `social-increase-rate` | 社会増減率 | context | 人口動態 | choropleth + bar | prefecture | 住民基本台帳人口移動報告 |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `ratio-65-plus` (高齢化率, 2024 年)

- 最新値: 全国 29.3% (令和 6 年 10 月 1 日現在、過去最高更新)
- 配色: 赤系発散カラースケール (全国平均 29.3% を白、高いほど赤)
- ホバー: 県名 + 高齢化率 + 全国順位 + 2050 年予測値

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 全国推移ライン

**何を見せるか**: 全国高齢化率の長期推移 (1950-2024 実績 + 2030/2040/2050 推計)

- データ源: 内閣府 高齢社会白書 + IPSS「日本の将来推計人口 (令和 5 年推計)」
- curiosity gap: **「1950 年 4.9% → 2024 年 29.3% → 2050 年 38.7%、2.6 人に 1 人が高齢者」**
- 実績と推計を異なる線種 (実線/破線) で描画
- 必要データ: `app/themes/aging-society/timeseries/ratio-65-plus.json`
  ```json
  { "metricKey": "ratio-65-plus", "scope": "national", "unit": "%",
    "series": [{ "year": 1950, "value": 4.9, "type": "actual" }, ...,
               { "year": 2050, "value": 38.7, "type": "projection" }] }
  ```

#### (B) 年齢 3 区分パイチャート

**何を見せるか**: 2024 年全国人口の年齢 3 区分構成 + 65+ の内訳 (65-74 / 75+)

| 区分 | 人口 | 割合 | 注目度 |
|---|---|---|---|
| 0-14 歳 | 約 1,401 万人 | 11.3% | **過去最低** (少子化の象徴) |
| 15-64 歳 | 約 7,373 万人 | 59.6% | - |
| 65-74 歳 | 約 1,535 万人 | 12.4% | 「前期高齢者」 |
| **75 歳以上** | **約 2,078 万人** | **16.8%** | **65-74 歳を上回り過去最高** |

- データ源: 総務省統計局 人口推計 2024 年 10 月 1 日確報
- 必要データ: `app/themes/aging-society/breakdown/age-structure.json`
- 都道府県切替トグル付き (デフォルト全国、選択で県別 4 区分)

#### (C) 上下位 5 県バーチャート

**何を見せるか**: 高齢化率 TOP 5 + BOTTOM 5 (2024 年)

```
秋田県   39.5% ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰
高知県   36.6% ▰▰▰▰▰▰▰▰▰▰▰▰▰▰
青森県   35.7% ▰▰▰▰▰▰▰▰▰▰▰▰▰▰
山形県   35.4% ▰▰▰▰▰▰▰▰▰▰▰▰▰▰
徳島県   35.3% ▰▰▰▰▰▰▰▰▰▰▰▰▰▰
─ 全国平均 29.3% ─
神奈川県 26.0% ▰▰▰▰▰▰▰▰▰▰
愛知県   25.7% ▰▰▰▰▰▰▰▰▰▰
滋賀県   25.5% ▰▰▰▰▰▰▰▰▰▰
沖縄県   24.0% ▰▰▰▰▰▰▰▰▰
東京都   22.8% ▰▰▰▰▰▰▰▰▰
```

- `app/ranking/ratio-65-plus/values.json` (Phase 2) から派生、別途 export 不要

### 2-3. パネルタブ — 既存維持 + 補助チャート追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **高齢化** | ratio-65-plus / aging-index / dependent-population-index / household-ratio-with-65plus | line: 老年化指数の全国推移 (1950→2024 で 13 → 260+、100 突破は 1997 年)<br>bar: 65+ 単独世帯数 TOP 5 |
| **出生・婚姻** | total-fertility-rate / crude-birth-rate / average-age-of-first-marriage-wife | line: 全国 TFR 推移 (1947 年 4.54 → 2005 年 1.26 → 2024 年 1.15 で過去最低)<br>bar: TFR TOP 5/BOTTOM 5 (沖縄 1.60 vs 東京 0.99) |
| **人口動態** | population-growth-rate / natural-increase-rate / social-increase-rate | line: 全国出生数推移 (戦後 270 万 → 2024 年 70 万割れ)<br>bar: 社会増減率 (東京 +0.5% vs 秋田 -0.9% で東京一極集中) |
| **考察** | (空) | 本文記事用 |

## 3. 参考にしたサイト (リサーチ結果)

- [内閣府 令和 7 年版高齢社会白書 PDF (s1_1_01)](https://www8.cao.go.jp/kourei/whitepaper/w-2025/zenbun/pdf/1s1s_01.pdf) — 高齢化率 29.3% / 2050 年 38.7% / 2.6 人に 1 人の出典。全国推移ラインと年齢区分パイのレイアウトを直接参考
- [内閣府 令和 6 年版高齢社会白書 地域別の高齢化](https://www8.cao.go.jp/kourei/whitepaper/w-2024/html/zenbun/s1_1_4.html) — 2050 年都道府県別高齢化率予測 (秋田 49.9% / 東京 29.6%)。県別 bar の上下位選定根拠
- [統計局 敬老の日 topics146 (2025 年版)](https://www.stat.go.jp/data/topics/pdf/topics146.pdf) — 75 歳以上 2,078 万人 / 16.8% の根拠。年齢区分パイのデータ源
- [統計局 人口推計 2024 年 10 月確報](https://www.stat.go.jp/data/jinsui/2024np/index.html) — 都道府県別 5 歳階級人口の e-Stat 公式データ源
- [GemMed: 2023 年 TFR 1.20 / 東京 0.99](https://gemmed.ghc-j.com/?p=61052) — 出生率 line / bar の数値裏付け
- [ハートページナビ: 高齢化率推移と都道府県ランキング](https://www.heartpage.jp/contents/magazine/08-00145) — 一般読者向けに「47 都道府県ランキング + 世界比較」を並べる構成。本テーマ詳細ページの記事用に流用

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (national) | `ratio-65-plus` | 1950-2024 実績 + 2030/2040/2050 推計 | `app/themes/aging-society/timeseries/ratio-65-plus.json` | 人口推計 + IPSS 令和 5 年推計 |
| timeseries (national) | `total-fertility-rate` | 1947-2024 (年次) | `app/themes/aging-society/timeseries/total-fertility-rate.json` | 人口動態統計 |
| timeseries (national) | `crude-birth-rate` | 1947-2024 | `app/themes/aging-society/timeseries/crude-birth-rate.json` | 同上 |
| timeseries (national) | `aging-index` | 1950-2024 | `app/themes/aging-society/timeseries/aging-index.json` | 人口推計 |
| timeseries (national) | `population-growth-rate` | 1950-2024 | `app/themes/aging-society/timeseries/population-growth-rate.json` | 人口推計 |
| breakdown (pie) | `ratio-65-plus` | 2024 (4 区分: 0-14 / 15-64 / 65-74 / 75+) | `app/themes/aging-society/breakdown/age-structure.json` | 統計局 人口推計 年齢階級別 |
| timeseries (prefecture) | `ratio-65-plus` | 2024 + 2050 推計 (47 都道府県) | `app/themes/aging-society/projection/ratio-65-plus-2050.json` | IPSS「日本の地域別将来推計人口」 |

**統合 JSON 案** (1 fetch 推奨、living-housing と同形式):

```json
{
  "themeKey": "aging-society",
  "timeseries": {
    "ratio-65-plus": { "scope": "national", "unit": "%", "series": [...] },
    "total-fertility-rate": { ... }
  },
  "breakdown": {
    "age-structure": { "label": "年齢区分", "items": [...] }
  },
  "projection": {
    "ratio-65-plus-2050": { ... }
  }
}
```

→ `app/themes/aging-society/charts.json` 1 ファイルに集約推奨。

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `ratio-75-plus` (後期高齢者比率) | 2024 年 16.8% で 65-74 歳 (12.4%) を上回り過去最高、医療介護の主要負担層。秋田/島根/高知で 20% 超 | 統計局 人口推計 (e-Stat 0003448237 系統) |
| `projected-aging-rate-2050` (2050 年高齢化率予測) | IPSS 推計の県別予測。秋田 49.9% (ほぼ 2 人に 1 人) vs 東京 29.6% の極端な格差を可視化できる | IPSS「日本の地域別将来推計人口 (令和 5 年推計)」 |
| `live-births` (年間出生数) | 2024 年に全国で初めて 70 万人割れ (68.6 万人)、TFR より直感的なインパクト | 人口動態統計 |

`ratio-75-plus` と `projected-aging-rate-2050` は **特に強い curiosity gap** を作れるため最優先で追加候補。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実 (`.claude/rules/blog-quality-standards.md` 準拠):

1. **「高齢化率 2024 年 29.3% で過去最高、2050 年には 2.6 人に 1 人が 65 歳以上」** — 過去最高 + 倍率換算
2. **「秋田 39.5% vs 東京 22.8%、なぜ東北で高齢化が急加速?」** — 疑問形 + 県間格差 (1.7 倍差)
3. **「2050 年、秋田の高齢化率は 49.9% でほぼ 2 人に 1 人──東京でも 29.6% に到達」** — 将来推計の衝撃
4. **「出生率は沖縄 1.60 vs 東京 0.99、東京は史上初めて 1.0 を切った」** — 西高東低 + 史上初
5. **「75 歳以上が 16.8% で 65-74 歳 (12.4%) を逆転、後期高齢化が本格化」** — 内訳の逆転現象

theme description (D1 themes.description) 書き換え推奨:

> 「2024 年に高齢化率 29.3% で過去最高──秋田 39.5%・東京 22.8%、出生率は沖縄 1.60 vs 東京 0.99 で史上初の 1.0 割れ。2050 年予測も含めて 47 都道府県の少子高齢化を地図とランキングで比較。」

## 7. 残課題 / 要検証

- [ ] `ratio-65-plus` の e-Stat statsDataId が 1950-2024 を 1 系統で取得できるか確認 (国勢調査年と人口推計年で系列が分かれる可能性)
- [ ] IPSS「日本の地域別将来推計人口」は e-Stat に無いため別取得経路 (PDF/Excel) が必要 → 新規スキル化候補 (living-housing の IPSS 課題と統合可能)
- [ ] 「年齢 3 区分」は `cdCat01` で 5 歳階級から集計か、それとも 3 区分集計済み statsDataId があるか `/inspect-estat-meta` で確認
- [ ] `total-fertility-rate` 1947 年からの時系列は厚労省 PDF 表のスクレイピングが必要かもしれない (e-Stat dbview には全期間あり: sid=0003411598)
- [ ] 実績と推計の line を 1 つの chart で描く UI 仕様 (線種切替の凡例) は frontend 設計で要決定

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- 見本: [`living-housing.md`](./living-housing.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/aging-society.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-plan.md`

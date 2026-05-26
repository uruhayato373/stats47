---
type: theme-chart-planning
date: 2026-05-26
theme_key: healthcare
status: drafted
research_sources:
  - https://www.mhlw.go.jp/toukei/saikin/hw/ishi/22/index.html
  - https://gemmed.ghc-j.com/?p=59881
  - https://gemmed.ghc-j.com/?p=63245
  - https://www.mhlw.go.jp/toukei/saikin/hw/iryosd/24/
  - https://www.mhlw.go.jp/toukei/saikin/hw/k-iryohi/23/index.html
  - https://seikatsusyukanbyo.com/statistics/2024/010777.php
tags: [theme-charts, healthcare]
---

# 医療・健康 (healthcare) — チャート構成設計

## 0. 結論サマリ

左コロプレスで「人口10万人あたり医師数」(2022 年最新) を地図表示、右に **(A) 全国推移ライン (国民医療費 1955→2023 で 2 千億→47 兆円超、人口10万対医師数 1980→2022)**、**(B) 診療科別医師数 構成 pie / 死因別死亡率 内訳 bar**、**(C) 上下位 5 県バー (京都 355.6 vs 埼玉 186.2、1.9 倍格差)** の 3 枚を縦に積む。医療供給・医療利用・健康のパネルタブにそれぞれ全国推移ラインを追加する。

## 1. 既存 metric 棚卸し

| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |
|---|---|---|---|---|---|---|
| `physicians-in-medical-facilities-per-100k` | 医師数 | primary | 医療供給 | choropleth + line + bar | prefecture / national | 医師・歯科医師・薬剤師統計 (隔年, 1980-2022) |
| `nurses-in-medical-facilities-per-100k` | 看護師数 | secondary | 医療供給 | choropleth + line | prefecture / national | 衛生行政報告例 (隔年) |
| `general-hospital-count-per-100k` | 病院数 | secondary | 医療供給 | choropleth + line | prefecture / national | 医療施設調査 (年次) |
| `general-hospital-bed-count-per-100k` | 病床数 | context | 医療供給 | choropleth + line | prefecture / national | 同上 |
| `pharmacy-count-per-100k` | 薬局数 | context | 医療供給 | choropleth | prefecture | 衛生行政報告例 |
| `national-medical-expense-per-person` | 医療費 | secondary | 医療利用 | choropleth + line + bar | prefecture / national | 国民医療費の概況 (年次, 1955-2023) |
| `general-hospital-avg-length-of-stay` | 平均在院日数 | context | 医療利用 | choropleth + line | prefecture / national | 病院報告 (年次) |
| `general-hospital-bed-occupancy-rate` | 病床利用率 | context | 医療利用 | choropleth + line | prefecture / national | 同上 |
| `deaths-lifestyle-diseases-per-100k` | 生活習慣病死亡 | secondary | 健康 | choropleth + bar | prefecture | 人口動態統計 (年次) |
| `deaths-diabetes-per-100k` | 糖尿病死亡 | context | 健康 | choropleth + line | prefecture / national | 同上 (青森ワースト 4 年連続) |
| `health-checkup-rate-lifestyle-diseases` | 健診受診率 | secondary | 健康 | choropleth | prefecture | 国民生活基礎調査 |
| `psychiatric-hospital-count-per-100k` | 精神科病院数 | context | 健康 | choropleth | prefecture | 医療施設調査 |
| `treatment-rate-mood-disorder-outpatient` | 気分障害受療率 | context | 健康 | choropleth | prefecture | 患者調査 (3 年ごと) |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `physicians-in-medical-facilities-per-100k` (人口10万人あたり医師数, 2022 年)

- 最新年は 2022 年 (令和 4 年医師・歯科医師・薬剤師統計、隔年)
- 配色: 青系の発散カラースケール (高いほど青、全国平均 274.7 を白)
- ホバー時: 県名 + 医師数 + 全国順位 + 京都との比

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 全国推移ライン

**何を見せるか**: 全国一人あたり国民医療費の推移 (1955-2023, 年次)

- データ源: 厚労省「国民医療費の概況」全国総額および一人あたり
- curiosity gap: **「2.4 千億円 (1955) → 47 兆円 (2023)、約 200 倍」「一人あたり 2,800 円 → 37 万円超」** をタイトルで打ち出す
- 必要データ: `app/themes/healthcare/timeseries/national-medical-expense-per-person.json`
  ```json
  { "metricKey": "national-medical-expense-per-person", "scope": "national",
    "unit": "円", "series": [{ "year": 1955, "value": 2800 }, ..., { "year": 2022, "value": 373700 }] }
  ```

#### (B) 死因 / 構成内訳バー

**何を見せるか**: 全国の主要死因別死亡率内訳 (生活習慣病の中身)

| 死因 | 死亡率 (人口10万対) | 構成 |
|---|---|---|
| がん (悪性新生物) | 約 316 | 1 位 |
| 心疾患 | 約 191 | 2 位 |
| 脳血管疾患 | 約 89 | 4 位 |
| 糖尿病 | 約 13 | 別途強調 |
| その他生活習慣病 | (合算) | - |

- データ源: 人口動態統計 死因簡単分類
- 必要データ: `app/themes/healthcare/breakdown/lifestyle-disease-deaths.json`
  ```json
  { "metricKey": "deaths-lifestyle-diseases-per-100k", "breakdown_dimension": "死因",
    "year": 2022, "items": [{ "label": "がん", "value": 316 }, ...] }
  ```
- 都道府県切替トグル付き (デフォルト全国、選択で県別内訳)

#### (C) 上下位 5 県バーチャート

**何を見せるか**: 医師数 (人口10万対) TOP 5 + BOTTOM 5

```
京都府   355.6 ▰▰▰▰▰▰▰▰▰▰▰
徳島県   352.0 ▰▰▰▰▰▰▰▰▰▰▰
高知県   347.0 ▰▰▰▰▰▰▰▰▰▰▰
長崎県   338.4 ▰▰▰▰▰▰▰▰▰▰
和歌山県 318.2 ▰▰▰▰▰▰▰▰▰▰
─ 全国平均 274.7 ─
新潟県   216.4 ▰▰▰▰▰▰▰
千葉県   215.8 ▰▰▰▰▰▰▰
茨城県   212.3 ▰▰▰▰▰▰▰
福島県   209.0 ▰▰▰▰▰▰
埼玉県   186.2 ▰▰▰▰▰▰
```

- choropleth と同じ `app/ranking/physicians-in-medical-facilities-per-100k/values.json` から派生
- 別途 export 不要

### 2-3. パネルタブ — 既存維持 + 補助チャート追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **医療供給** | physicians / nurses / hospitals / beds / pharmacies | line: 人口10万対医師数の全国推移 (1980→2022、150→274 で 1.8 倍)<br>line: 病床数の全国推移 (1990 ピーク→緩減で「病床過剰→削減トレンド」の意外性) |
| **医療利用** | medical-expense / length-of-stay / bed-occupancy | line: 国民医療費総額の全国推移 (1955→2023)<br>line: 平均在院日数の全国推移 (1990 約45日→2023 約27日、ほぼ半減) |
| **健康** | lifestyle / diabetes / checkup / psychiatric / mood-disorder | bar: 主要死因別死亡率の構成内訳 (がん 316 / 心疾患 191 / 脳血管 89)<br>line: 糖尿病死亡率の全国推移 (1980→2022、青森と全国の対比) |
| **考察** | (空) | (現状通り、本文記事用) |

## 3. 参考にしたサイト (リサーチ結果)

- [厚生労働省: 令和４(2022)年医師・歯科医師・薬剤師統計の概況](https://www.mhlw.go.jp/toukei/saikin/hw/ishi/22/index.html) — 公式の代表数値。京都 355.6 vs 埼玉 186.2、全国平均 274.7 の都道府県別表
- [GemMed: 人口10万人当たり医師数 京都と埼玉で1.90倍の格差](https://gemmed.ghc-j.com/?p=59881) — 西高東低パターンと2年比較。curiosity gap (1.90 倍格差) の典型表現
- [GemMed: 2022年度国民医療費 47兆円、高知と埼玉で1.44倍](https://gemmed.ghc-j.com/?p=63245) — 一人あたり医療費の都道府県格差。高知 47.9 万 vs 埼玉 33.2 万
- [厚生労働省: 令和６(2024)年医療施設動態調査・病院報告の概況](https://www.mhlw.go.jp/toukei/saikin/hw/iryosd/24/) — 平均在院日数・病床利用率の年次推移と県別表 (Excel)
- [厚生労働省: 令和５(2023)年度 国民医療費の概況](https://www.mhlw.go.jp/toukei/saikin/hw/k-iryohi/23/index.html) — 国民医療費の最新時系列 (1955-2023)、診療種類別構成
- [日本生活習慣病予防協会: 糖尿病による年間死亡者数](https://seikatsusyukanbyo.com/statistics/2024/010777.php) — 糖尿病死亡率の県別ランキング (青森 20.2 vs 神奈川 7.8、約 2.6 倍格差)

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (national) | `national-medical-expense-per-person` | 1955-2023 (年次) | `app/themes/healthcare/timeseries/national-medical-expense-per-person.json` | 国民医療費の概況 |
| timeseries (national) | `physicians-in-medical-facilities-per-100k` | 1980-2022 (隔年) | `app/themes/healthcare/timeseries/physicians-per-100k.json` | 医師・歯科医師・薬剤師統計 |
| timeseries (national) | `general-hospital-bed-count-per-100k` | 1990-2024 (年次) | `app/themes/healthcare/timeseries/hospital-beds-per-100k.json` | 医療施設調査 |
| timeseries (national) | `general-hospital-avg-length-of-stay` | 1990-2024 (年次) | `app/themes/healthcare/timeseries/avg-length-of-stay.json` | 病院報告 |
| timeseries (national) | `deaths-diabetes-per-100k` | 1980-2022 (年次) | `app/themes/healthcare/timeseries/diabetes-deaths.json` | 人口動態統計 |
| breakdown (bar) | `deaths-lifestyle-diseases-per-100k` | 2022 | `app/themes/healthcare/breakdown/lifestyle-disease-deaths.json` | 人口動態統計 死因簡単分類 |
| breakdown (pie) | `physicians-in-medical-facilities-per-100k` | 2022 | `app/themes/healthcare/breakdown/physicians-by-specialty.json` | 医師統計 診療科別 (内科/外科/小児科/産婦人科/精神科/その他) |

**統合 JSON 案**: `app/themes/healthcare/charts.json` 1 ファイルに timeseries + breakdown をまとめる方が fetch 回数が減って fast。Phase 3 設計時に判断。

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `physicians-pediatrics-per-100k` (小児科医師数) | 鳥取 187 vs 千葉 102 で 1.8 倍格差、少子化政策との関連で curiosity gap が強い | 医師統計 診療科別 (statsDataId: 0003411662 系) |
| `physicians-obgyn-per-100k` (産婦人科医師数) | 福井 66 vs 埼玉 35 で 1.9 倍格差、お産難民問題の可視化 | 同上 |
| `avoidable-deaths-per-100k` (回避可能死亡率) | OECD 指標。医療アクセスと健康アウトカムの統合指標 | 厚労省「医療の質指標」or OECD Health Statistics |

小児科・産婦人科は **強い curiosity gap** (お産難民) を作れるので最優先で追加候補。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実 (`.claude/rules/blog-quality-standards.md` 準拠):

1. **「京都 355.6 vs 埼玉 186.2、医師数は 1.9 倍格差──なぜ西高東低?」** — 倍率 + 疑問形 + 地域構造
2. **「医師が多い県ほど医療費も高い──高知 47.9 万 vs 埼玉 33.2 万、1.44 倍」** — 逆説 (医師充実 = 健康 ではなく医療費増)
3. **「平均在院日数は 30 年で半減 (45→27 日)、なのに病床数は減らない」** — 矛盾
4. **「糖尿病死亡率は青森 20.2 vs 神奈川 7.8、東北で 2.6 倍高い」** — 比較 + 倍率 + 地域偏り

theme description (D1 themes.description) を以下に書き換え推奨:

> 「人口10万人あたり医師数 京都 355.6 vs 埼玉 186.2 で 1.9 倍格差、一人あたり医療費 高知 47.9 万円が全国最高。47 都道府県の医療供給・利用・健康指標を地図とランキングで比較。」

## 7. 残課題 / 要検証

- [ ] 医師統計の `cdCat` で診療科内訳 (内科/外科/小児科/産婦人科/精神科) が取れるか `/inspect-estat-meta` で確認
- [ ] 国民医療費の年次データが 1955 年から e-Stat で連続取得可能か (古い年は別 statsDataId の可能性)
- [ ] 死因別死亡率は人口動態統計のどの statsDataId で県別 × 死因の cross 集計が取れるか確認
- [ ] 平均在院日数の県別時系列が病院報告でカバーされる年度範囲 (1990 以降?)
- [ ] 上下位 5 県バーは独立 chart_type か、それとも choropleth コンポーネントの補助 UI として実装するか (frontend 設計判断)

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- 見本: [`living-housing.md`](./living-housing.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/healthcare.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-d1-migration.md`

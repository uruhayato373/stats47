---
type: theme-chart-planning
date: 2026-05-26
theme_key: manufacturing
status: drafted
research_sources:
  - https://www.meti.go.jp/statistics/tyo/kkj/pdf/seizo_gaikyo2024.pdf
  - https://www.meti.go.jp/statistics/tyo/kkj/index.html
  - https://www.meti.go.jp/statistics/tyo/kougyo/result-2.html
  - https://www.pref.aichi.jp/ricchitsusho/en/industrial_capital/
  - https://www.nippon.com/en/guide-to-japan/pref23/aichi-prefecture.html
  - https://www.stat.go.jp/library/faq/faq08/faq08b02.html
tags: [theme-charts, manufacturing, industry]
---

# 製造業 (manufacturing) — チャート構成設計

## 0. 結論サマリ

左コロプレスで「製造品出荷額」(2023 年最新) を地図表示、右に **(A) 全国推移ライン (出荷額・付加価値の年次推移、リーマン→震災→コロナの 3 段ダウンを可視化)**、**(B) 業種別構成パイ (輸送用機械 21.4% 一強、化学 8.9% / 食料品 8.8%)**、**(C) 上下位 5 県バー (愛知 49 兆円 vs 沖縄 0.5 兆円で約 100 倍格差)** の 3 枚を縦に積む。1977 年以降「愛知県が 49 年連続首位」という超長期独占構造を curiosity gap として打ち出す。

## 1. 既存 metric 棚卸し

| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |
|---|---|---|---|---|---|---|
| `manufacturing-shipment-amount` | 出荷額 | primary | 生産規模 | choropleth + line + bar | prefecture / national | 経済構造実態調査 (2021-、年次)。それ以前は工業統計調査 (~2020) |
| `manufacturing-industry-added-value` | 付加価値額 | secondary | 生産規模 | choropleth + line | prefecture / national | 同上 |
| `manufacturing-sales-private` | 製造品売上高 | context | 生産規模 | choropleth | prefecture | 経済構造実態調査 (民営事業所) |
| `manufacturing-net-value-added-private` | 純付加価値額 | context | 生産規模 | choropleth | prefecture | 同上 |
| `manufacturing-establishments` | 事業所数 | secondary | 事業所・雇用 | choropleth + line | prefecture / national | 工業統計→経済構造 (継続性あり) |
| `manufacturing-employees` | 従業者数 | secondary | 事業所・雇用 | choropleth + line | prefecture / national | 同上 |
| `manufacturing-establishment-site-area` | 敷地面積 | context | 事業所・雇用 | choropleth | prefecture | 経済構造実態調査 |
| `factory-establishment-count` | 工場立地件数 | context | 事業所・雇用 | choropleth + line | prefecture / national | 経産省 工場立地動向調査 (半期) |
| `manufacturing-shipment-amount-per-employee` | 出荷額/人 | secondary | 生産性・土地 | choropleth + bar | prefecture | 出荷額 ÷ 従業者数で派生計算 |
| `manufacturing-shipment-amount-per-establishment` | 出荷額/所 | secondary | 生産性・土地 | choropleth + bar | prefecture | 出荷額 ÷ 事業所数で派生計算 |
| `industrial-land-price` | 工業地価格 | context | 生産性・土地 | choropleth | prefecture | 国土交通省 地価公示 |
| `industrial-land-price-change-rate` | 工業地価変動率 | context | 生産性・土地 | choropleth + line | prefecture / national | 同上 |
| `industrial-water-usage` | 工業用水量 | context | 生産性・土地 | choropleth | prefecture | 経産省 工業用水使用量調査 |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `manufacturing-shipment-amount` (製造品出荷額, 2023 年)

- 配色: 青系の単方向カラースケール (高いほど濃い青、対数スケールで愛知の突出を可視化)
- 愛知が桁外れに大きいため線形だと他県が潰れる → 対数スケール推奨
- ホバー: 県名 + 出荷額 (兆円) + 全国順位 + 全国シェア (%)

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 全国推移ライン

**何を見せるか**: 全国の製造品出荷額の年次推移 (2007-2023, 17 ポイント程度)

- curiosity gap: **「ピーク 336 兆円 (2007) → リーマンで -20%、震災で停滞、コロナで -8%、2022 で 373 兆円と過去最高更新」** をタイトル化
- 出荷額と付加価値額の 2 本線重ねで「価格高騰で出荷額は伸びても付加価値は伸び悩み」を示唆
- 必要データ: `app/themes/manufacturing/timeseries/manufacturing-shipment-amount.json`
  ```json
  { "metricKey": "manufacturing-shipment-amount", "scope": "national",
    "unit": "兆円", "series": [{ "year": 2007, "value": 336.7 }, ..., { "year": 2023, "value": 372.6 }] }
  ```

#### (B) 業種別構成パイチャート

**何を見せるか**: 製造品出荷額の **産業中分類別構成** (全国 2024 年最新)

| 順位 | 業種 | 出荷額 | 構成比 |
|---|---|---|---|
| 1 | 輸送用機械器具 | 79.8 兆円 | **21.4%** |
| 2 | 化学工業 | 33.4 兆円 | 8.9% |
| 3 | 食料品 | 33.0 兆円 | 8.8% |
| 4 | 生産用機械 | ~22 兆円 | ~5.9% |
| 5 | 電子部品・デバイス | ~18 兆円 | ~4.8% |
| 6 | 鉄鋼 | ~18 兆円 | ~4.8% |
| 7 | 石油・石炭製品 | ~16 兆円 | ~4.3% |
| - | その他 (17 業種) | 残り | ~41% |

- データ源: e-Stat 経済構造実態調査 製造業事業所調査 (statsDataId 要確認)
- 必要データ: `app/themes/manufacturing/breakdown/manufacturing-by-industry.json`
  ```json
  { "metricKey": "manufacturing-shipment-amount", "breakdown_dimension": "産業中分類",
    "year": 2023, "items": [{ "label": "輸送用機械", "value": 79841700, "ratio": 0.214 }, ...] }
  ```
- 都道府県切替トグル付き (愛知選択時は輸送用機械が 50% 超で 1 業種偏重が可視化される)

#### (C) 上下位 5 県バーチャート

**何を見せるか**: 出荷額 TOP 5 + BOTTOM 5 (2023 年, 単位: 兆円)

```
愛知県    約 49 兆円 ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰ (全国シェア 約13%)
大阪府    約 19 兆円 ▰▰▰▰▰▰▰
静岡県    約 18 兆円 ▰▰▰▰▰▰▰
神奈川県  約 18 兆円 ▰▰▰▰▰▰▰
兵庫県    約 17 兆円 ▰▰▰▰▰▰
─ 全国合計 約 373 兆円 ─
鳥取県    約 0.9 兆円 ▰
高知県    約 0.6 兆円 ▰
奈良県    約 0.6 兆円 ▰
沖縄県    約 0.5 兆円 ▰
(最下位は概ね沖縄)
```

- 愛知 vs 沖縄で **約 100 倍格差** (全 47 テーマ中でも突出した格差)
- `app/ranking/manufacturing-shipment-amount/values.json` から派生

### 2-3. パネルタブ — 既存維持 + 補助チャート追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **生産規模** | shipment-amount / industry-added-value / sales-private / net-value-added-private | line: 出荷額 vs 付加価値額の全国推移 (2007→2023、出荷額は回復したが付加価値は伸び悩む剥離)<br>pie: 業種別構成 (上記 (B) を流用) |
| **事業所・雇用** | establishments / employees / site-area / factory-establishment-count | line: 事業所数の長期推移 (1980 約 73 万 → 2023 約 22 万で 70% 減という衝撃的データ)<br>line: 工場立地件数の年次推移 (リーマン以降の構造変化) |
| **生産性・土地** | shipment/employee / shipment/establishment / industrial-land-price / land-price-change / water-usage | bar: 出荷額/人 TOP 5 (山口・千葉・大分など石油化学コンビナート集積県が上位という意外性)<br>line: 工業地価変動率の全国推移 |

## 3. 参考にしたサイト (リサーチ結果)

- [経産省 2024 年経済構造実態調査 製造業事業所調査 概要 PDF](https://www.meti.go.jp/statistics/tyo/kkj/pdf/seizo_gaikyo2024.pdf) — 業種別構成比 (輸送用機械 21.4%, 化学 8.9%, 食料品 8.8%) と前年比変化 (輸送用機械 +1.9pt) の一次ソース。本論パイチャートのデータ源
- [経産省 経済構造実態調査 ポータル](https://www.meti.go.jp/statistics/tyo/kkj/index.html) — 2021 年以降の最新シリーズ (旧工業統計の後継)。statsDataId と公開状況の確認用
- [経産省 工業統計調査 結果ページ](https://www.meti.go.jp/statistics/tyo/kougyo/result-2.html) — ~2020 年までの長期時系列データ。時系列ラインの接続元として使用
- [愛知県庁 Industrial Capital of Japan (英語サイト)](https://www.pref.aichi.jp/ricchitsusho/en/industrial_capital/) — 「1977 年以降毎年全国 1 位」「輸送用機械の全国シェア 40%」「県内 GDP 35.1% が製造業」の curiosity gap 一次ソース
- [Nippon.com Aichi Prefecture Guide](https://www.nippon.com/en/guide-to-japan/pref23/aichi-prefecture.html) — 中京工業地帯の構成 (輸送機械・電子・鉄鋼・航空宇宙) の一般読者向け解説。記事冒頭の文脈付けに使用
- [統計局 FAQ: 産業別製造品出荷額及び付加価値額](https://www.stat.go.jp/library/faq/faq08/faq08b02.html) — 工業統計 → 経済構造実態調査の接続方法と定義変更の公式説明 (時系列分析時の必読)

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (national) | `manufacturing-shipment-amount` | 2007-2023 (17 点) | `app/themes/manufacturing/timeseries/manufacturing-shipment-amount.json` | 工業統計 + 経済構造実態 |
| timeseries (national) | `manufacturing-industry-added-value` | 2007-2023 | `app/themes/manufacturing/timeseries/manufacturing-industry-added-value.json` | 同上 |
| timeseries (national) | `manufacturing-establishments` | 1980-2023 (年次) | `app/themes/manufacturing/timeseries/manufacturing-establishments.json` | 同上 (長期トレンド要) |
| timeseries (national) | `manufacturing-employees` | 1980-2023 | `app/themes/manufacturing/timeseries/manufacturing-employees.json` | 同上 |
| timeseries (national) | `factory-establishment-count` | 2000-2024 | `app/themes/manufacturing/timeseries/factory-establishment-count.json` | 経産省 工場立地動向調査 |
| breakdown (pie) | `manufacturing-shipment-amount` | 2023 | `app/themes/manufacturing/breakdown/manufacturing-by-industry.json` | 経済構造実態調査 産業中分類別 |
| breakdown (pie, 県別) | `manufacturing-shipment-amount` | 2023 / 47 県 | `app/themes/manufacturing/breakdown/by-prefecture/{areaCode}.json` | 同上 (県別 + 中分類のクロス) |

**統合 JSON 案**: `app/themes/manufacturing/charts.json` 1 ファイルに timeseries + 全国 breakdown をまとめる。県別 breakdown のみ別ファイル (47 県分は大きいため)。

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `manufacturing-transportation-equipment-share` (輸送用機械シェア) | 愛知 50%超、静岡 30%超など「車県」を可視化。中京 vs 京浜の構造差が一目でわかる | 経済構造実態調査 (中分類別 県別クロス) |
| `manufacturing-industry-concentration-hhi` (業種集中度 HHI) | ハーフィンダール指数で「単一業種依存度」を測る。愛知の脆弱性 (車一本足) と山口・大分の石油化学依存を可視化 | 経済構造実態 産業中分類別出荷額から計算 |
| `manufacturing-shipment-amount-growth-10y` (10 年成長率) | リーマン以降回復組 (愛知・福岡) と縮小組 (大阪・東京) の分岐を明示 | 既存 metric から派生計算 |

業種シェア metric は **強い curiosity gap** を作れるため最優先で追加候補。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実:

1. **「愛知県は 1977 年から 49 年連続 1 位、製造品出荷額の全国シェアは 1 県で 13%」** — 半世紀の独占構造を curiosity gap 化
2. **「沖縄の製造品出荷額は愛知の 100 分の 1、なぜここまで開いた?」** — 倍率 + 疑問形
3. **「輸送用機械が出荷額の 21%、愛知 1 県で輸送機械の 40% を独占」** — 業種偏重 + 地域独占
4. **「工場の数は 1980 年から 70% 減、しかし出荷額は過去最高──消えた工場と残った巨大工場」** — 逆説 (数は減ったが規模は拡大)

theme description (D1 themes.description) 改訂案:

> 「2023 年の製造品出荷額は 372 兆円で過去最高更新、愛知 1 県で全国 13% シェア・1977 年から 49 年連続 1 位。輸送用機械 21%・化学 9%・食料品 9% で偏在する 47 都道府県の製造業構造を地図とランキングで比較。」

## 7. 残課題 / 要検証

- [ ] 工業統計調査 (~2020) と 経済構造実態調査 (2021~) の接続性確認。集計対象事業所規模 (4 人以上→全事業所) で系列断裂あり → 注記必須
- [ ] e-Stat 経済構造実態調査の「産業中分類別 × 都道府県別」クロス集計の statsDataId を `/inspect-estat-meta` で特定
- [ ] 工場立地動向調査は経産省独自集計で e-Stat 経由ではない可能性あり → 別取得経路の検討
- [ ] 出荷額/人・出荷額/所 の派生計算は既存 ranking-values でカバー済みか、新規 exporter が必要か確認
- [ ] 愛知の対数スケール choropleth は他の 16 テーマと統一感が崩れる懸念 → frontend 側で metric ごとにスケール指定可能にする設計判断が必要

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- 見本: [`living-housing.md`](./living-housing.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/manufacturing.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-plan.md`

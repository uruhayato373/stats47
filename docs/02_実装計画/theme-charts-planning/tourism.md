---
type: theme-chart-planning
date: 2026-05-26
theme_key: tourism
status: drafted
research_sources:
  - https://www.mlit.go.jp/kankocho/tokei_hakusyo/shukuhakutokei.html
  - https://www.kankokeizai.com/2507220630kks/
  - https://yamatogokoro.jp/inbound_data/57413
  - https://www.nippon.com/en/japan-data/h02262/
  - https://www.jnto.go.jp/statistics/data/_files/20250820_1615-6.pdf
  - https://www.travelvoice.jp/20251031-158592
tags: [theme-charts, tourism]
---

# 観光 (tourism) — チャート構成設計

## 0. 結論サマリ

左コロプレスで「外国人延べ宿泊者数」(2024 年最新) を地図表示、右に **(A) 全国推移ライン (2019 → コロナで半減 → 2024 で 1.6 億人泊・過去最多に V 字回復)**、**(B) 国籍別構成パイ (中 18% / 台 13% / 韓 13% / 米 10% / 香 6% で上位 5 か国 60%)**、**(C) 上下位 5 県バー (東京 5,680 万 vs 下位 1% 未満)** の 3 枚を縦に積む。三大都市圏 (東京/大阪/京都) で全外国人宿泊の **69.1%** が集中するという curiosity gap を最前面に出す。

## 1. 既存 metric 棚卸し

| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |
|---|---|---|---|---|---|---|
| `total-overnight-guests-foreign` | 外国人宿泊 | primary | 宿泊 | choropleth + line + bar + pie | prefecture / national | 観光庁 宿泊旅行統計調査 (月次, 確報は年次) |
| `total-overnight-guests` | 宿泊者数 | secondary | 宿泊 | choropleth + line | prefecture / national | 同上 (日本人+外国人合算) |
| `room-utilization-rate` | 客室稼働率 | secondary | 宿泊 | choropleth + line | prefecture / national | 同上 (施設タイプ別あり) |
| `number-of-simple-lodging-facilities` | 簡易宿所数 | context | 宿泊 | choropleth + bar | prefecture | 衛生行政報告例 (年次) |
| `travel-participation-rate-domestic-tourism` | 国内旅行率 | secondary | 旅行・交通 | choropleth | prefecture | 旅行・観光消費動向調査 |
| `travel-participation-rate-overseas` | 海外旅行率 | context | 旅行・交通 | choropleth | prefecture | 同上 |
| `travel-participation-rate-overnight` | 宿泊旅行率 | context | 旅行・交通 | choropleth | prefecture | 同上 |
| `travel-participation-rate-day-trip` | 日帰り旅行率 | context | 旅行・交通 | choropleth | prefecture | 同上 |
| `air-passenger-transport` | 航空旅客 | secondary | 旅行・交通 | choropleth + line | prefecture / national | 航空輸送統計 |
| `jr-passenger-transport` | JR旅客 | context | 旅行・交通 | choropleth | prefecture | 鉄道輸送統計 |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `total-overnight-guests-foreign` (外国人延べ宿泊者数, 2024 年)

- 最新年データは 2024 (令和 6 年確定値, 観光庁 2025-07 公表)
- 配色: 紫系の sequential カラースケール (対数スケール推奨。東京 5,680 万 vs 下位県 数十万で 100 倍以上の格差)
- ホバー時: 県名 + 万人泊 + 全国順位 + シェア %

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 全国推移ライン

**何を見せるか**: 全国の延べ宿泊者数 (日本人 + 外国人) 推移 2010-2024 + 外国人内数

- データ源: 観光庁 宿泊旅行統計調査の全国集計値
- curiosity gap: **「2020 年に半減 (3.3 億 → 1.6 億人泊) → 2024 年 6.6 億人泊で過去最多 V 字回復」** をタイトルで打ち出す
- 二系列 line: 「全体」「外国人内数」(2019: 1.16 億 → 2020: 0.20 億 → 2024: 1.64 億)
- 必要データ: `app/themes/tourism/timeseries/overnight-guests.json`
  ```json
  { "themeKey": "tourism", "scope": "national", "unit": "万人泊",
    "series": {
      "total": [{ "year": 2010, "value": 38000 }, ..., { "year": 2024, "value": 65906 }],
      "foreign": [{ "year": 2010, "value": 2600 }, ..., { "year": 2024, "value": 16360 }]
    } }
  ```

#### (B) 国籍別構成パイチャート

**何を見せるか**: 外国人延べ宿泊 1.64 億人泊の **国籍別内訳** (上位 5 + その他, 2024 年)

| 国・地域 | 人泊数 | シェア |
|---|---|---|
| 中国 | 2,519 万 | 18.2% |
| 台湾 | 1,841 万 | 13.3% |
| 韓国 | 1,800 万 | 13.0% |
| アメリカ | 1,449 万 | 10.5% |
| 香港 | 779 万 | 5.6% |
| **その他** | 約 5,500 万 | **39.4%** |

- データ源: 観光庁 宿泊旅行統計調査 国籍別集計 (e-Stat statsDataId: 宿泊旅行統計調査 参考第 2 表系列)
- 必要データ: `app/themes/tourism/breakdown/foreign-by-nationality.json`
  ```json
  { "metricKey": "total-overnight-guests-foreign", "breakdown_dimension": "国籍",
    "year": 2024, "items": [{ "label": "中国", "value": 25190000, "ratio": 0.182 }, ...] }
  ```
- 都道府県切替トグル付き (北海道は中国/台湾偏重、九州は韓国偏重などの地域偏りを可視化)

#### (C) 上下位 5 県バーチャート

**何を見せるか**: 外国人延べ宿泊者数 TOP 5 + BOTTOM 5

```
東京都   5,680 万 ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰
大阪府   2,539 万 ▰▰▰▰▰▰▰▰▰
京都府   1,694 万 ▰▰▰▰▰▰
北海道   1,031 万 ▰▰▰▰
福岡県     739 万 ▰▰▰
─ 全国平均 約 348 万 (1.64 億 / 47) ─
(下位 5 県: 福井 / 秋田 / 島根 / 佐賀 / 徳島 等、いずれも 数十万人泊・シェア 1% 未満)
```

- choropleth と同じ `app/ranking/total-overnight-guests-foreign/values.json` (prefecture, Phase 2 で snapshot 化) から派生
- 別途 export 不要
- 補助コピー: 「上位 3 都府県で **全外国人宿泊の 58.2%** が集中」

### 2-3. パネルタブ — 既存維持 + 補助チャート追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **宿泊** | total-overnight-guests / total-overnight-guests-foreign / room-utilization-rate / number-of-simple-lodging-facilities | line: 客室稼働率の全国推移 (2019 約 62% → 2020 約 34% に半減 → 2024 ?% 回復)<br>pie: 外国人宿泊の国籍別 (上記 B を再掲) |
| **旅行・交通** | travel-participation-rate-* / air-passenger-transport / jr-passenger-transport | line: 航空旅客の全国推移 (国内+国際, コロナ前後の回復軌跡)<br>bar: 旅行参加率 4 種 (国内/海外/宿泊/日帰り) の全国平均比較 |
| **考察** | (空) | (現状通り、本文記事用) |

## 3. 参考にしたサイト (リサーチ結果)

- [観光庁: 宿泊旅行統計調査 (公式ポータル)](https://www.mlit.go.jp/kankocho/tokei_hakusyo/shukuhakutokei.html) — 月次速報・年次確報の PDF/Excel 一括ダウンロード源。都道府県別・施設タイプ別・国籍別の集計表が揃う
- [観光経済新聞: 2024 年の外国人延べ宿泊者数は 1.6 億人 過去最多も際立つ地域差](https://www.kankokeizai.com/2507220630kks/) — 三大都市圏 69.1% 集中、地方の伸び率較差 (大都市 +56.5% vs 地方 +18.0%) という curiosity gap の決定版データ
- [やまとごころ: 2024 年外国人宿泊 4 割増の 1.6 億人泊。石川・愛媛で 2 倍超](https://yamatogokoro.jp/inbound_data/57413) — 国籍別シェア表 (中 18% / 台 13% / 韓 13%) と地方部急伸数値の参考
- [Nippon.com: Japan Sets New Record with 36.9 Million International Visitors in 2024](https://www.nippon.com/en/japan-data/h02262/) — 国際向け curiosity gap 表現「47.1% YoY / record」「韓国 8.8M / 中国 7.0M (+187.9%)」を踏襲
- [JNTO: 訪日外客数年次データ PDF](https://www.jnto.go.jp/statistics/data/_files/20250820_1615-6.pdf) — 国籍別訪日者数の一次ソース。宿泊統計と組み合わせて「訪日者 1 人あたり何泊」の派生指標も作れる
- [トラベルボイス: 観光庁の宿泊旅行統計とは？ 外国人宿泊者の地域差](https://www.travelvoice.jp/20251031-158592) — 統計の読み解き解説。記事本文の「データの定義・限界」コラム用

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (national) | `total-overnight-guests` + `total-overnight-guests-foreign` (2 系列) | 2010-2024 (年次 15 点) | `app/themes/tourism/timeseries/overnight-guests.json` | 宿泊旅行統計調査 全国集計 |
| timeseries (national) | `room-utilization-rate` | 2010-2024 | `app/themes/tourism/timeseries/room-utilization.json` | 同上 |
| timeseries (national) | `air-passenger-transport` | 2010-2024 | `app/themes/tourism/timeseries/air-passenger.json` | 航空輸送統計 |
| breakdown (pie) | `total-overnight-guests-foreign` | 2024 国籍別 | `app/themes/tourism/breakdown/foreign-by-nationality.json` | 宿泊旅行統計調査 参考第 2 表 |
| breakdown (pie) | `total-overnight-guests` | 2024 施設タイプ別 (ホテル/旅館/簡易宿所等) | `app/themes/tourism/breakdown/by-facility-type.json` | 同上 |

**統合 JSON 案** (1 fetch で複数 chart データを取得):

```json
{
  "themeKey": "tourism",
  "timeseries": {
    "overnight-guests": { "scope": "national", "unit": "万人泊",
      "series": { "total": [...], "foreign": [...] } },
    "room-utilization": { ... },
    "air-passenger": { ... }
  },
  "breakdown": {
    "foreign-by-nationality": { "label": "国籍", "year": 2024, "items": [...] },
    "by-facility-type": { "label": "施設タイプ", "year": 2024, "items": [...] }
  }
}
```

→ `app/themes/tourism/charts.json` 1 ファイルにまとめる方が fetch 回数が減って fast。Phase 3 設計時に判断 (living-housing と同じ判断軸)。

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `foreign-guests-share` (外国人宿泊シェア %) | 全宿泊に占める外国人比率。京都/大阪/東京で 40-50% 超、地方は 5% 未満という強い格差を 1 枚で可視化できる | 宿泊旅行統計調査 (foreign / total) で派生計算可 |
| `inbound-spending-per-prefecture` (1 県あたり訪日消費額) | 訪日 1 人あたり消費 21 万円・総額 8.1 兆円のうち各県シェアを示せる。「東京 / 大阪以外に金が落ちない」curiosity gap | 観光庁 訪日外国人消費動向調査 (都道府県別は四半期で公表) |
| `room-utilization-by-facility-type` (施設タイプ別客室稼働率) | シティホテル 80% 超 vs 旅館 40% 台 という業態間格差。地方旅館の苦境を地図化できる | 宿泊旅行統計調査 (施設タイプ × 都道府県) |

`foreign-guests-share` は既存 2 metric から派生できるため **最優先で追加候補**。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実 (`.claude/rules/blog-quality-standards.md` 準拠):

1. **「外国人宿泊 1.6 億人泊で過去最多、だが東京/大阪/京都で 58% 集中──地方は伸び率も 1/3」** — 数値 + 逆説 (回復したのは都市部だけ)
2. **「コロナで宿泊半減 → 4 年で過去最多に V 字回復、客室稼働率は ?% まで戻った」** — 半減→過去最多の対比
3. **「北海道は中国/台湾、九州は韓国──外国人の国籍は来る場所で別物」** — 地域偏りの意外性
4. **「上位 5 か国 (中・台・韓・米・香) で全外国人宿泊の 60%、中国だけで 18%」** — 集中率の数値

theme description (D1 themes.description) を以下に書き換え推奨:

> 「2024 年に外国人延べ宿泊 1.64 億人泊で過去最多──東京 5,680 万 vs 地方は数十万、上位 3 都府県で 58% 集中。コロナで半減した宿泊市場が 4 年で V 字回復した 47 都道府県の地域差を地図とランキングで比較。」

## 7. 残課題 / 要検証

- [ ] `total-overnight-guests-foreign` の国籍別内訳が e-Stat で `cdCat01` 等の次元として取れるか、それとも別 statsDataId か (`/inspect-estat-meta` で宿泊旅行統計調査の cdCat 構造を確認)
- [ ] 都道府県 × 国籍のクロス集計が取得可能か (B のパイ「県別切替トグル」実現に必須)
- [ ] `room-utilization-rate` の全国時系列が e-Stat の単一 statsDataId で 2010-2024 取得できるか (調査年度コードの変遷確認)
- [ ] `air-passenger-transport` は国内線/国際線の内訳が必要か (旅客流動の curiosity gap には国際線が効くが、都道府県別では空港単位の集計が必要)
- [ ] 三大都市圏 (東京/大阪/京都) 集中率を**自動算出して description に組み込む**仕組みが必要か (毎年更新時に手動更新だと劣化する)
- [ ] 訪日消費動向調査の都道府県別データは e-Stat 配下か観光庁 PDF のみか確認 (新規 metric `inbound-spending-per-prefecture` の実装難度判定)

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- 見本: [`living-housing.md`](./living-housing.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/tourism.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-plan.md`

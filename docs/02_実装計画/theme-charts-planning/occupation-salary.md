---
type: theme-chart-planning
date: 2026-05-26
theme_key: occupation-salary
status: drafted
research_sources:
  - https://www.e-stat.go.jp/dbview?sid=0003445758
  - https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/z2024/sokuhou.html
  - https://doda.jp/guide/heikin/syokusyu/
  - https://doda.jp/guide/heikin/area/
  - https://tenshoku.mynavi.jp/knowhow/income/ranking/01/
  - https://www.geekly.co.jp/column/cat-position/engineer-income-ranking/
tags: [theme-charts, occupation-salary, economy]
---

# 職業別年収 (occupation-salary) — チャート構成設計

> 39 metrics と最多。サブカテゴリ別タブ整理 + 「職業間格差」を主軸に据える。

## 0. 結論サマリ

左コロプレスで **「医師年収」(primary, 2023 年)** を地図表示、右に **(A) 主要職業 5 種の全国推移 line (医師 vs 看護師 vs 介護 vs SE vs 保育士)**、**(B) 全国 職業別年収ランキング bar (39 職種を降順、医師 1,500 万 vs 介護 350 万で 4 倍格差)**、**(C) 上下位 5 県 bar (選択中の職業、デフォルトは医師)** の 3 枚を縦に積む。タブは医療/IT・専門/教育/運輸・建設/サービス の 5 軸 (既存維持) で、各タブ内に「該当職種群の全国推移 line + 県内ランキング bar」を追加。

## 1. 既存 metric 棚卸し

39 metrics → サブカテゴリ別に整理。表は role=primary/secondary を抜粋し、context (24 件) は末尾に集約表記。

### 1-1. 医療・福祉系 (14 metrics)

| rankingKey | shortLabel | role | 想定 chart_type | データ可用性メモ |
|---|---|---|---|---|
| `doctor-annual-income` | 医師 | **primary** | choropleth + line + bar | 賃金構造基本統計調査 (年次, 2010-2023) |
| `nurse-annual-income` | 看護師 | secondary | choropleth + line | 同上 |
| `pharmacist-annual-income` | 薬剤師 | secondary | choropleth + line | 同上 |
| `care-worker-annual-income` | 介護職員 | secondary | choropleth + line | 同上 (低位職種代表) |
| `nursery-teacher-annual-income` | 保育士 | secondary | choropleth + line | 同上 |
| (context 9 件) | 助産師 / 准看護師 / 歯科衛生士 / 栄養士 / 理学療法士 / 保健師 / 看護助手 / ケアマネ / 訪問介護 | context | bar (タブ内ランキング) | 同上 |

### 1-2. IT・専門職 (5 metrics)

| rankingKey | shortLabel | role | 想定 chart_type | データ可用性メモ |
|---|---|---|---|---|
| `system-consultant-annual-income` | SIer/コンサル | secondary | choropleth + line | 賃金構造基本統計調査 |
| `software-engineer-annual-income` | SE | secondary | choropleth + line | 同上 (東京 1 強) |
| `manager-annual-income` | 管理職 | secondary | choropleth + bar | 同上 |
| (context 3 件) | 会計士・税理士 / デザイナー / 研究者 | context | bar (タブ内ランキング) | 同上 |

### 1-3. 教育系 (5 metrics)

| rankingKey | shortLabel | role | 想定 chart_type | データ可用性メモ |
|---|---|---|---|---|
| `school-teacher-annual-income` | 小中学校教員 | secondary | choropleth + line | 賃金構造基本統計調査 |
| (context 4 件) | 大学教授 / 大学准教授 / 高校教員 / 幼稚園教員 | context | bar (タブ内ランキング) | 同上 |

### 1-4. 運輸・建設系 (8 metrics)

| rankingKey | shortLabel | role | 想定 chart_type | データ可用性メモ |
|---|---|---|---|---|
| `truck-driver-annual-income` | トラック運転手 | secondary | choropleth + line | 2024 年問題で注目 |
| `taxi-driver-annual-income` | タクシー運転手 | secondary | choropleth + bar | 同上 |
| (context 6 件) | バス運転手 / 大工 / 電気工事 / 建築技術者 / パイロット / 自動車整備 | context | bar (タブ内ランキング) | パイロットは特殊高位 |

### 1-5. サービス系 (5 metrics)

| rankingKey | shortLabel | role | 想定 chart_type | データ可用性メモ |
|---|---|---|---|---|
| (context 5 件) | 調理従事者 / 理容・美容師 / 警備員 / 販売店員 / 清掃・廃棄物 | context | bar (タブ内ランキング) | 全般に低位帯 |

### 1-6. その他 (歯科医師は medical 内に再分類検討)

| rankingKey | shortLabel | role |
|---|---|---|
| `dentist-annual-income` | 歯科医師 | context (医療系に再配置候補) |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `doctor-annual-income` (医師年収, 2023 年) をデフォルト、職業セレクタで 39 種切替

- 配色: 緑系のシーケンシャル (高いほど濃緑)
- ホバー時: 県名 + 年収 + 全国平均比 + 順位
- セレクタ UI: 「医療/IT/教育/運輸/サービス」フィルタ → 職業ドロップダウン

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 主要 5 職業の全国推移 line

**何を見せるか**: 医師 / SE / 看護師 / 保育士 / 介護職員 の年収推移 (2010-2023, 年次)

- curiosity gap: **「医師 1,500 万 vs 介護 350 万、13 年間で格差は縮まったか?」**
- 凡例クリックで職業の表示切替
- 必要データ: `app/themes/occupation-salary/timeseries/by-occupation.json`
  ```json
  { "themeKey": "occupation-salary", "scope": "national", "unit": "万円",
    "series": [
      { "metricKey": "doctor-annual-income", "label": "医師",
        "points": [{ "year": 2010, "value": 1140 }, ..., { "year": 2023, "value": 1500 }] },
      { "metricKey": "software-engineer-annual-income", "label": "SE", "points": [...] },
      { "metricKey": "nurse-annual-income", "label": "看護師", "points": [...] },
      { "metricKey": "nursery-teacher-annual-income", "label": "保育士", "points": [...] },
      { "metricKey": "care-worker-annual-income", "label": "介護職員", "points": [...] }
    ]
  }
  ```

#### (B) 全国 職業別年収 横棒 (39 職種, 同一県内比較)

**何を見せるか**: 選択中の県 (デフォルト全国) における 39 職業の年収を降順 bar (上から: 医師 → パイロット → 大学教授 → 管理職 → ... → 介護 → 清掃)

- curiosity gap: **「同じ県内でも医師と清掃で年収 4 倍超」「パイロットは全国でも東京近郊にしか存在しない」**
- 39 本 bar は縦長スクロール or top/bottom 10 + 中位省略
- 必要データ: `app/themes/occupation-salary/breakdown/by-prefecture/[areaCode].json`
  ```json
  { "areaCode": "13000", "year": 2023,
    "items": [
      { "metricKey": "doctor-annual-income", "label": "医師", "value": 1550 },
      { "metricKey": "pilot-annual-income", "label": "パイロット", "value": 1700 },
      ...
      { "metricKey": "cleaning-worker-annual-income", "label": "清掃・廃棄物", "value": 305 }
    ]
  }
  ```

#### (C) 選択職業の上下位 5 県 bar

**何を見せるか**: 現在地図で選択中の職業の TOP 5 + BOTTOM 5

- 医師の例:
  ```
  福島県  1,820 万円 ▰▰▰▰▰▰▰▰▰▰▰
  茨城県  1,750 万円 ▰▰▰▰▰▰▰▰▰▰
  ...
  ─ 全国平均 1,500 万円 ─
  ...
  京都府  1,230 万円 ▰▰▰▰▰▰
  ```
- SE の例: 東京 700 万 vs 沖縄 380 万 → 「IT は東京 1 強」を可視化
- choropleth と同じ `app/ranking/[rankingKey]/values.json` から派生 (別途 export 不要)

### 2-3. パネルタブ — 既存 5 タブ維持 + 各タブにチャート追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **医療・福祉** | 14 metrics (医師〜訪問介護) | line: 医師 vs 看護師 vs 介護 vs 保育の全国推移 (「医療内 4 倍格差」)<br>bar: 同一県内 14 職種年収ランキング |
| **IT・専門** | 6 metrics (SIer/SE/会計士/デザイナー/研究者/管理職) | line: SE vs 管理職 vs 研究者 (2010-2023)<br>bar: 東京 vs 沖縄の IT 年収比較 (倍率強調) |
| **教育** | 5 metrics (小中/大学教授/准教授/高校/幼稚園) | line: 小中教員 vs 大学教授 (教員給与の停滞傾向)<br>bar: 県別教員年収 (公務員比較) |
| **運輸・建設** | 8 metrics (トラック/タクシー/バス/大工/電工/建築/パイロット/整備) | line: トラック運転手の推移 (2024 年問題で 2023→2024 変化)<br>bar: パイロットだけ突出する構造を可視化 |
| **サービス** | 5 metrics (調理/理美容/警備/販売/清掃) | line: 5 職種の推移 (全般低位停滞)<br>bar: 全国一覧 (最下位帯) |

## 3. 参考にしたサイト (リサーチ結果)

- [e-Stat: 賃金構造基本統計調査令和2年以降 一般_都道府県別_職種（特掲）DB](https://www.e-stat.go.jp/dbview?sid=0003445758) — 都道府県 × 職種クロス集計の公式 DB (本テーマの主データ源、statsDataId はこのページから取得)
- [厚労省: 令和6年賃金構造基本統計調査 速報](https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/z2024/sokuhou.html) — 2024 年最新の速報値。Phase 3 で 2024 年データの追加投入時に参照
- [doda: 平均年収ランキング（職種・職業別）](https://doda.jp/guide/heikin/syokusyu/) — 一般読者向けの職種別年収ランキング表示パターン (横棒 + 倍率強調) を参考
- [doda: 平均年収ランキング（47都道府県・地方別）](https://doda.jp/guide/heikin/area/) — 東京 476 万 vs 地方 350 万帯の格差表現
- [マイナビ: 全321職種モデル年収ランキング 2025](https://tenshoku.mynavi.jp/knowhow/income/ranking/01/) — 戦略コンサル 1,410 万、システムアナリスト 1,269 万など上位職の参考値 (SE/コンサルの D1 値と突合確認用)
- [Geekly: エンジニア平均年収ランキング 職種別・年代別・言語別](https://www.geekly.co.jp/column/cat-position/engineer-income-ranking/) — SE/SIer/コンサル の細分化年収。「東京 1 強」curiosity gap の根拠

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (national, 多系列) | 主要 5 職業 (医師/SE/看護師/保育士/介護) | 2010-2023 | `app/themes/occupation-salary/timeseries/by-occupation.json` | 賃金構造基本統計調査 全国集計 |
| timeseries (national, 全 39) | 全 39 metrics | 2010-2023 | `app/themes/occupation-salary/timeseries/all.json` (オプション、サイズ注意) | 同上 |
| breakdown (bar) | 39 職業 × 47 都道府県 | 2023 | `app/themes/occupation-salary/breakdown/by-prefecture/[areaCode].json` (47 ファイル) | 賃金構造基本統計調査 都道府県別職種別 |
| breakdown (bar) | 39 職業 全国値 | 2023 | `app/themes/occupation-salary/breakdown/by-prefecture/national.json` | 同上 |

**統合 JSON 案** (テーマ chart 1 fetch 集約):

```json
{
  "themeKey": "occupation-salary",
  "timeseries": {
    "main5": { "scope": "national", "unit": "万円", "series": [...] }
  },
  "breakdown": {
    "byPrefecture_national": { "year": 2023, "items": [...39 items...] }
  }
}
```

→ `app/themes/occupation-salary/charts.json` 1 ファイル + 県別 breakdown は遅延 fetch にする方が良い (39 × 47 = 1,833 セル分の全国集約は重い)。Phase 3 設計時に判断。

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `occupation-wage-gap-ratio` (職業間年収格差倍率) | 県内の最高職業 / 最低職業の倍率を県別に算出。「都市部ほど格差が大きい」仮説を可視化 | 既存 39 metrics から計算で導出可 (新規 e-Stat fetch 不要) |
| `it-engineer-tokyo-premium` (IT エンジニア東京プレミアム) | SE 年収 (各県) / SE 年収 (全国平均) の比率。東京の集中度を 1 値で表現 | 同上、計算派生 |
| `medical-care-wage-gap` (医療内格差: 医師 / 介護) | 医師年収 / 介護職員年収の県別比率。「医療従事者内の 4 倍格差」を地図化 | 同上、計算派生 |

新規 e-Stat 取得は不要 (既存 39 metrics の派生で実現可)。Phase 3 で `theme_metrics` 投入時にビュー (D1 view) として追加検討。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実 (`.claude/rules/blog-quality-standards.md` 準拠):

1. **「医師年収 1,500 万 vs 介護 350 万、同じ医療内で 4 倍格差──なぜ?」** — 疑問形 + 倍率
2. **「SE 年収は東京 700 万 vs 沖縄 380 万、地方では SE になるほど損か?」** — 比較 + 逆説
3. **「パイロットだけ全国でも 1,700 万、しかし住む県は限られる」** — 単一職種の特異性
4. **「保育士年収は 13 年間で +80 万、それでも医師の 1/4 のまま」** — 変化したけど構造は変わらない逆説
5. **「同じ県内でも年収 4-5 倍格差、47 都道府県 × 39 職業の "職業地図"」** — 大規模データの網羅性

theme description (D1 themes.description) を以下に書き換え推奨:

> 「医師 1,500 万、介護 350 万──同じ医療職でも 4 倍格差、SE は東京 700 万 vs 沖縄 380 万。47 都道府県 × 39 職業の年収を地図とランキングで可視化 (賃金構造基本統計調査 2023)。」

## 7. 残課題 / 要検証

- [ ] 39 metrics 全てが `0003445758` (都道府県別職種特掲 DB) で取得できるか、それとも一部は別 statsDataId か `/inspect-estat-meta` で確認
- [ ] 2010 年以前のデータは `0003084610` (令和元年以前 職種 DB) に分かれている → 時系列接続時の職種コード対応表が必要
- [ ] パイロット・大学教授など県別データが欠損する職種の扱い (N/A 表示か、関東圏のみ表示か)
- [ ] 39 職業 × 47 都道府県 = 1,833 セル の breakdown JSON サイズ試算 (圧縮後 100KB 以内か)
- [ ] サブカテゴリ tab 内の「同一県内ランキング bar」は新 chart_type が必要か、既存 bar の引数拡張で実現できるか
- [ ] 「歯科医師」を医療・福祉 tab に再配置するか (現在 panelTabs には未登録の context metric)
- [ ] 2024 年最新値 (令和 6 年速報) を取り込む時期 (D1 articles と整合)

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- 見本: [`living-housing.md`](./living-housing.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/occupation-salary.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-plan.md`

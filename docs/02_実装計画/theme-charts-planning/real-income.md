---
type: theme-chart-planning
date: 2026-05-26
theme_key: real-income
status: drafted
research_sources:
  - https://www.stat.go.jp/data/zenkokukakei/2019/index.html
  - https://www.stat.go.jp/data/kouri/kouzou/pdf/g_2024.pdf
  - https://www.soumu.go.jp/menu_news/s-news/01toukei08_01000314.html
  - https://www.mlit.go.jp/policy/shingikai/content/001389727.pdf
  - https://newsphere.jp/national/income-expenditure-by-prefecture/
  - https://www5.cao.go.jp/j-j/cr/cr24-1/img/chr24-1_03-04z.html
tags: [theme-charts, real-income, economy]
---

# 実質収入・購買力 (real-income) — チャート構成設計

## 0. 結論サマリ

左コロプレスで「実質可処分所得」(CPI 補正後) を地図表示、右に **(A) 全国推移 line (名目可処分所得 vs 実質可処分所得の乖離、2014→2024)**、**(B) 支出内訳 bar (家賃/食料/光熱費 等の費目別、東京 vs 全国平均)**、**(C) 上下位 5 県 bar (実質可処分所得)** の 3 枚を縦に積む。「東京は名目 3 位だが家賃高で実質では中位以下」を curiosity gap として打ち出す。

## 1. 既存 metric 棚卸し

| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |
|---|---|---|---|---|---|---|
| `real-disposable-income` | 実質可処分所得 | primary | 物価補正後 | choropleth + line + bar | prefecture / national | 計算指標 (可処分所得 ÷ CPI 地域差指数) |
| `disposable-income-after-rent` | 家賃控除後手残り | secondary | 物価補正後 | choropleth + bar | prefecture | 計算指標 (可処分所得 - 家賃支出) |
| `disposable-income-worker-households` | 可処分所得 | primary | 名目収入 | choropleth + line | prefecture / national | 家計調査 (年次, 二人以上勤労者世帯) |
| `actual-income-worker-households-per-month` | 実収入 | secondary | 名目収入 | choropleth + line | prefecture / national | 家計調査 (月次集計) |
| `per-capita-prefectural-income-h27` | 県民所得/人 | secondary | 名目収入 | choropleth + line | prefecture / national | 県民経済計算 (内閣府, 年次) |
| `annual-income-per-household` | 世帯年収 | context | 名目収入 | choropleth | prefecture | 全国家計構造調査 (5年ごと, 最新 2019) |
| `consumer-price-difference-index-overall` | CPI総合 | context | 物価・家賃 | choropleth + line | prefecture / national | 小売物価統計調査 構造編 (年次, 最新 2024) |
| `consumer-price-difference-index-overall-excl-rent` | CPI(家賃除く) | context | 物価・家賃 | choropleth | prefecture | 同上 |
| `consumer-price-difference-index-housing` | CPI(住居) | context | 物価・家賃 | choropleth + bar | prefecture | 同上 (住居費目) |
| `private-rental-housing-rent-per-3-3m2` | 家賃/3.3m² | context | 物価・家賃 | choropleth + bar | prefecture | 小売物価統計調査 |
| `private-rent-consumption-expenditure` | 家賃支出 | context | 物価・家賃 | choropleth + line | prefecture / national | 家計調査 |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `real-disposable-income` (実質可処分所得, 最新年)

- 配色: 緑系の発散カラースケール (高いほど緑、全国平均を白)
- ホバー時: 県名 + 実質可処分所得 + 名目可処分所得 + CPI 地域差指数 + 順位
- ラベル: 「名目では東京 3 位 (43.6万円) だが、CPI 104.0 で補正すると順位逆転」を吹き出しで表示

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 全国推移ライン (名目 vs 実質)

**何を見せるか**: 全国の可処分所得推移 (2014-2024, 11 ポイント) を **名目線・実質線の 2 系列** で重ねる

- データ源: 家計調査 (二人以上勤労者世帯) 年次平均 + CPI (全国平均=100 を基準)
- curiosity gap: **「名目は 10 年で +12% 増えたが、実質はほぼ横ばい」** をタイトルで打ち出す
- 必要データ: `app/themes/real-income/timeseries/disposable-income-nominal-real.json`
  ```json
  { "metricKey": "disposable-income-worker-households", "scope": "national",
    "unit": "円/月",
    "series": [
      { "year": 2014, "nominal": 423500, "real": 423500 },
      { "year": 2024, "nominal": 474200, "real": 425100 }
    ] }
  ```

#### (B) 支出内訳バー (東京 vs 全国平均)

**何を見せるか**: 可処分所得の **支出構成** を東京 vs 全国平均で並列比較 (家賃/食料/光熱・水道/交通・通信/その他)

| 費目 | 全国平均 (月) | 東京 (月) | 差 |
|---|---|---|---|
| 家賃 (民営) | 約 5.8 万円 | 約 8.7 万円 | +50% |
| 食料 | 約 8.2 万円 | 約 9.1 万円 | +11% |
| 光熱・水道 | 約 2.4 万円 | 約 2.1 万円 | -13% |
| 交通・通信 | 約 4.5 万円 | 約 4.3 万円 | -4% |
| その他 | 約 9.0 万円 | 約 10.2 万円 | +13% |

- データ源: 家計調査 (二人以上勤労者世帯) 10 大費目別支出、e-Stat statsDataId
- 必要データ: `app/themes/real-income/breakdown/expenditure-tokyo-vs-national.json`
  ```json
  { "metricKey": "real-disposable-income", "breakdown_dimension": "費目",
    "year": 2024,
    "series": [
      { "label": "家賃", "national": 58000, "tokyo": 87000 },
      { "label": "食料", "national": 82000, "tokyo": 91000 }
    ] }
  ```
- 県切替トグル付き (デフォルト東京、選択で他県と全国の比較)

#### (C) 上下位 5 県バーチャート

**何を見せるか**: 実質可処分所得 TOP 5 + BOTTOM 5 (CPI 補正後)

```
富山県   約 44.3万円 ▰▰▰▰▰▰▰▰▰▰▰
福井県   約 43.5万円 ▰▰▰▰▰▰▰▰▰▰▰
三重県   約 42.0万円 ▰▰▰▰▰▰▰▰▰▰
山形県   約 41.4万円 ▰▰▰▰▰▰▰▰▰▰
茨城県   約 41.0万円 ▰▰▰▰▰▰▰▰▰▰
─ 全国平均 約 37 万円 ─
東京都   約 33.6万円 ▰▰▰▰▰▰▰▰
神奈川県 約 33.1万円 ▰▰▰▰▰▰▰▰
高知県   約 32.0万円 ▰▰▰▰▰▰▰
鹿児島県 約 31.8万円 ▰▰▰▰▰▰▰
沖縄県   約 30.5万円 ▰▰▰▰▰▰▰
```

- choropleth と同じ `app/ranking/real-disposable-income/values.json` から派生 (別途 export 不要)
- 補助: 各バーに「名目順位 → 実質順位」の矢印表示で順位逆転を強調

### 2-3. パネルタブ — 既存維持 + 補助チャート追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **名目収入** | disposable-income-worker-households / actual-income-worker-households-per-month / per-capita-prefectural-income-h27 / annual-income-per-household | line: 可処分所得・実収入・県民所得の全国推移を 3 系列重ねる (1990→2024) |
| **物価補正後** | real-disposable-income / disposable-income-after-rent | bar: 「名目順位 vs 実質順位」逆転マトリクス (上位/下位 10 県、矢印で順位変動可視化) |
| **物価・家賃** | CPI総合 / CPI(家賃除く) / CPI(住居) / 家賃/3.3m² / 家賃支出 | line: CPI 地域差指数の経年推移 (2013→2024、東京 vs 群馬 vs 全国の 3 系列。「12 年連続で東京 1 位」を強調)<br>bar: 家賃/3.3m² 上下位 5 県 (東京 vs 青森で約 3 倍格差) |
| **考察** | (空) | (現状通り、本文記事用) |

## 3. 参考にしたサイト (リサーチ結果)

- [総務省統計局: 2019 年全国家計構造調査](https://www.stat.go.jp/data/zenkokukakei/2019/index.html) — 都道府県別の年間収入・可処分所得の公式集計。「東京 629.7 万 vs 沖縄 423.3 万」の名目格差の出典
- [総務省統計局: 消費者物価地域差指数 2024 年結果 PDF](https://www.stat.go.jp/data/kouri/kouzou/pdf/g_2024.pdf) — 東京 104.0、群馬 96.2 の CPI ランキング。住居費目の寄与度分析
- [総務省 報道資料: 消費者物価地域差指数 2024](https://www.soumu.go.jp/menu_news/s-news/01toukei08_01000314.html) — 「12 年連続で東京 1 位」という公式表現。タイトル文言の参照元
- [国土交通省: 地方の豊かさに関する参考資料](https://www.mlit.go.jp/policy/shingikai/content/001389727.pdf) — 「可処分所得 - 基礎支出」で三重 1 位・富山 2 位・東京下位という公式分析。実質ランキング設計の根拠
- [NewSphere: なぜ東京が経済的豊かさ全国最下位なのか](https://newsphere.jp/national/income-expenditure-by-prefecture/) — 「名目 3 位の東京が中間層で実質最下位」の curiosity gap 表現の典型例
- [内閣府 地域課題分析レポート 図表 3-4](https://www5.cao.go.jp/j-j/cr/cr24-1/img/chr24-1_03-04z.html) — 公式のコロプレス + 棒グラフ複合レイアウト参考

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (national) | `disposable-income-worker-households` | 1990-2024 (年次) | `app/themes/real-income/timeseries/disposable-income-nominal-real.json` (名目+実質 2 系列) | 家計調査 + CPI |
| timeseries (national) | `per-capita-prefectural-income-h27` | 1980-2022 (年次) | `app/themes/real-income/timeseries/per-capita-prefectural-income.json` | 県民経済計算 |
| timeseries (national) | `consumer-price-difference-index-overall` | 2013-2024 | `app/themes/real-income/timeseries/cpi-overall.json` (東京/群馬/全国 3 系列) | 小売物価統計調査 構造編 |
| breakdown (bar) | `real-disposable-income` | 2024 | `app/themes/real-income/breakdown/expenditure-tokyo-vs-national.json` | 家計調査 10 大費目 (e-Stat statsDataId: 0002070001 系) |
| comparison (bar) | `real-disposable-income` | 2024 | `app/themes/real-income/breakdown/nominal-vs-real-rank.json` (47 県 × 名目順位/実質順位) | 計算指標 |

**統合 JSON 案** (1 fetch で複数 chart データを取れる構成):

```json
{
  "themeKey": "real-income",
  "timeseries": {
    "disposable-income-nominal-real": { "scope": "national", "unit": "円/月", "series": [...] },
    "cpi-overall": { "scope": "prefecture-selected", "labels": ["東京","群馬","全国"], "series": [...] }
  },
  "breakdown": {
    "expenditure-tokyo-vs-national": { "label": "10 大費目", "items": [...] },
    "nominal-vs-real-rank": { "label": "名目→実質順位変動", "items": [...] }
  }
}
```

→ `app/themes/real-income/charts.json` 1 ファイルに統合し fetch 回数を削減。

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `disposable-income-rank-shift-nominal-to-real` | 「名目順位 → 実質順位」の差分を 1 つの指標化。東京 (+30 位下落) のような順位逆転をランキング化できる | 計算指標 (名目可処分所得 / CPI 地域差指数の順位差) |
| `housing-cost-share-of-disposable-income` | 家賃支出 ÷ 可処分所得。東京 26% vs 地方 13% という「家賃負担率」格差を可視化 | 家計調査 (e-Stat statsDataId: 0002070001 系) |
| `real-minimum-wage-prefecture` | 最低賃金 ÷ CPI 地域差指数。「東京 1,226 円も CPI 104.0 で補正すると沖縄 1,023 円とほぼ同等」の意外性 | 厚労省 最低賃金 + CPI |

「家賃負担率」は最も強い curiosity gap (「東京は所得の 1/4 が家賃に消える」) なので最優先で追加候補。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実 (`.claude/rules/blog-quality-standards.md` 準拠):

1. **「名目所得 3 位の東京、物価補正で実質 30 位以下に転落──富山・福井が"本当に豊かな県"」** — 順位逆転 + 疑問
2. **「家賃 3.3m² 単価、東京と青森で約 3 倍格差──最低賃金 1,226 円も実質では沖縄 1,023 円とほぼ同じ?」** — 倍率 + 逆説
3. **「12 年連続で物価 1 位の東京、可処分所得の 1/4 が家賃に消える」** — 公式数値 + 衝撃換算
4. **「名目可処分所得は 10 年で +12% 増、でも実質はほぼ横ばい──"見せかけの賃上げ"の正体」** — 矛盾

theme description (D1 themes.description) を以下に書き換え推奨:

> 「東京の可処分所得は名目 3 位 (43.6 万円) だが、CPI 104.0・家賃 8.7 万円で補正すると下位に転落。富山・福井が"本当に豊かな県"の理由を 47 都道府県の物価・家賃データで検証。」

## 7. 残課題 / 要検証

- [ ] `real-disposable-income` は計算指標。元となる `disposable-income-worker-households` と `consumer-price-difference-index-overall` の年度整合を確認 (家計調査は年次、CPI は構造編 5 年ごと → 補間ロジックの妥当性)
- [ ] `disposable-income-after-rent` の「家賃」定義 (持ち家帰属家賃を含むか) を `/inspect-estat-meta` で確認
- [ ] 「名目順位 vs 実質順位」マトリクスは独立 chart_type か、bar の派生 UI かで実装判断
- [ ] 家計調査の 10 大費目別データは `cdCat01` (費目分類) 次元で 47 県分取得可能か確認 (家計調査は二人以上勤労者世帯のみ県別公表という制約あり)
- [ ] 全国家計構造調査 (5 年ごと) と家計調査 (年次) のどちらをベースにするか統一が必要 (前者は標本大、後者は時系列細かい)

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- 見本: [`living-housing.md`](./living-housing.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/real-income.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-plan.md`

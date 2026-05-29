---
type: theme-chart-planning
date: 2026-05-26
theme_key: consumer-prices
status: drafted
research_sources:
  - https://www.stat.go.jp/data/kouri/kouzou/pdf/g_2024.pdf
  - https://www.soumu.go.jp/menu_news/s-news/01toukei08_01000314.html
  - https://www.stat.go.jp/data/kouri/kouzou/gaiyou.html
  - https://www.pref.kagawa.lg.jp/tokei/seikatsu/tiiki/2024chiiki.html
  - https://www5.cao.go.jp/j-j/cr/cr24-1/img/chr24-1_03-04z.html
  - https://www.stat.go.jp/data/kakei/2024np/index.html
tags: [theme-charts, consumer-prices]
---

# 物価・消費 (consumer-prices) — チャート構成設計

## 0. 結論サマリ

左コロプレスで「総合 CPI 地域差指数」(2024 年最新) を地図表示、右に **(A) 全国平均 = 100 を基準に最高 東京 104.0・最低 群馬 96.2 の経年推移 line + 県切替**、**(B) 10 大費目別 地域差指数 bar (選択県の対全国乖離: 東京なら住居 +27.2 / 食料 +2.4 等)**、**(C) 上下位 5 県 bar** の 3 枚を縦に積む。費目別の格差は住居が圧倒的 (東京 127.2 vs 岐阜 81.3、約 1.56 倍) という curiosity gap を全面に押し出す。

## 1. 既存 metric 棚卸し

| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |
|---|---|---|---|---|---|---|
| `consumer-price-difference-index-overall` | 総合 | primary | 総合 | choropleth + line + bar | prefecture / national | 小売物価統計調査(構造編) 年次 (1985-2024) |
| `consumer-price-difference-index-overall-excl-rent` | 家賃除く総合 | secondary | 総合 | choropleth + line | prefecture / national | 同上 (家賃除けば地域差 1.08→1.04 倍に縮小) |
| `consumer-price-difference-index-food` | 食料 | secondary | 生活費 | choropleth + bar | prefecture | 同上 (10 大費目別) |
| `consumer-price-difference-index-housing` | 住居 | secondary | 生活費 | choropleth + bar | prefecture | 同上 (格差 1.56 倍、最大費目) |
| `consumer-price-difference-index-utilities` | 光熱・水道 | secondary | 生活費 | choropleth + bar | prefecture | 同上 (北海道 109 vs 高知 89 等の寒冷地差) |
| `consumer-price-difference-index-education` | 教育 | context | その他 | choropleth | prefecture | 同上 |
| `consumer-price-difference-index-culture-recreation` | 教養娯楽 | context | その他 | choropleth | prefecture | 同上 |
| `consumer-price-difference-index-transport-communication` | 交通・通信 | context | その他 | choropleth | prefecture | 同上 |
| `consumer-price-difference-index-healthcare` | 保健医療 | context | その他 | choropleth | prefecture | 同上 |
| `consumer-price-difference-index-clothing-footwear` | 被服 | context | その他 | choropleth | prefecture | 同上 |
| `consumer-price-difference-index-furniture-household` | 家具 | context | その他 | choropleth | prefecture | 同上 |
| `consumer-price-difference-index-miscellaneous` | 諸雑費 | context | その他 | choropleth | prefecture | 同上 |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `consumer-price-difference-index-overall` (総合 CPI 地域差指数, 2024 年)

- 配色: 発散カラースケール (全国平均 100 を白、>100 を赤、<100 を青)
- 範囲は実測 96.2〜104.0 のため ±5 で正規化
- ホバー: 県名 + 総合指数 + 順位 + 「家賃除く指数」併記

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 全国基準の経年推移 line

**何を見せるか**: 「全国平均 = 100」基準で総合指数の上位/下位の経年推移 (2010-2024, 15 ポイント)

- 既定で表示: 東京 (104.0) / 全国平均 (100) / 群馬 (96.2) の 3 ライン
- 都道府県切替トグルで任意の県を「全国平均との対比」で追跡
- curiosity gap: **「物価が一番高い東京と一番安い群馬で 8 ポイント、家賃除けば 4 ポイント」** — 家賃が格差の半分を生む事実
- 必要データ: `app/themes/consumer-prices/timeseries/overall-by-prefecture.json`
  ```json
  { "metricKey": "consumer-price-difference-index-overall", "scope": "prefecture",
    "unit": "index (全国=100)", "years": [2010, ..., 2024],
    "series": [{ "areaCode": "13000", "values": [105.2, ..., 104.0] }, ...] }
  ```

#### (B) 10 大費目別 地域差指数 bar (選択県の対全国乖離)

**何を見せるか**: 選択県 (デフォルト東京) の **10 大費目別 指数を横バー** で全国平均からの乖離として表示

```
住居      +27.2 ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰  (東京 127.2)
教育       +5.8 ▰▰▰▰
食料       +2.4 ▰▰
教養娯楽   +1.5 ▰
保健医療   +0.7 ▰
交通通信   -0.3
被服       -1.2 ▰
諸雑費     -1.8 ▰
家具       -2.1 ▰▰
光熱水道   -2.9 ▰▰
```

- 都道府県切替で任意の県を表示 (例: 北海道なら光熱水道 +9 が突出)
- これは「pie」よりも「正負両方向 bar」が適切 (構成比ではなく乖離の正負を見る)
- 必要データ: `app/themes/consumer-prices/breakdown/by-category.json`
  ```json
  { "metricKey": "consumer-price-difference-index-overall",
    "breakdown_dimension": "10大費目", "year": 2024,
    "categories": ["食料","住居","光熱水道","家具","被服","保健医療","交通通信","教育","教養娯楽","諸雑費"],
    "prefectures": [{ "areaCode": "13000", "values": [102.4, 127.2, 97.1, ...] }, ...] }
  ```
- 1 ファイルで全 47 県 × 10 費目 (= 470 セル) を持つので fetch 1 回で済む

#### (C) 上下位 5 県 bar

**何を見せるか**: 総合 CPI 地域差指数 TOP 5 + BOTTOM 5 (2024)

```
東京都   104.0 ▰▰▰▰▰▰▰▰
神奈川県 103.3 ▰▰▰▰▰▰▰
北海道   101.9 ▰▰▰▰▰
山形県   101.4 ▰▰▰▰▰
千葉県   101.2 ▰▰▰▰
─ 全国平均 100.0 ─
大分県    97.4 ▰▰
岐阜県    97.1 ▰▰▰
宮崎県    97.0 ▰▰▰
鹿児島県  96.4 ▰▰▰▰
群馬県    96.2 ▰▰▰▰
```

- choropleth と同じ `app/ranking/consumer-price-difference-index-overall/values.json` から派生 (別 export 不要)

### 2-3. パネルタブ — 既存維持 + 補助チャート追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **総合** | overall / overall-excl-rent | line: 総合 vs 家賃除く の経年推移 (家賃を引くと格差が半減、東京 104.0→101.5 に縮小する事実を可視化) |
| **生活費** | food / housing / utilities | bar (横並び): 食料 / 住居 / 光熱水道 の TOP/BOTTOM 県を 3 列並列 — 住居だけ突出 (1.56 倍格差) し、食料・光熱水道は 1.1 倍に収まる対比 |
| **その他** | education / culture-recreation / transport-communication / healthcare / clothing / furniture / miscellaneous | bar: 7 費目の「全国格差倍率 (最大値÷最小値)」ランキング — 教育 1.13 / 諸雑費 1.08 等を並べ、住居 (1.56) との対比で「他の費目は意外に揃っている」事実を打ち出す |
| **考察** | (空) | 本文記事用、「家賃を除けば物価格差は小さい」「東京の生活コストは住居以外ほぼ全国平均」等のテーマ |

## 3. 参考にしたサイト (リサーチ結果)

- [統計局: 消費者物価地域差指数 2024 年結果 PDF](https://www.stat.go.jp/data/kouri/kouzou/pdf/g_2024.pdf) — 公式 1 次資料。10 大費目別の都道府県表が掲載 (Phase 3 で statsDataId 経由で取得)
- [総務省: 2024 年結果 報道資料](https://www.soumu.go.jp/menu_news/s-news/01toukei08_01000314.html) — TOP/BOTTOM 5 と寄与度分析の根拠
- [統計局: 小売物価統計調査(構造編) 概要ページ](https://www.stat.go.jp/data/kouri/kouzou/gaiyou.html) — 時系列データの全公開ページ
- [香川県: 2024 年地域差指数概況](https://www.pref.kagawa.lg.jp/tokei/seikatsu/tiiki/2024chiiki.html) — 県別解説の典型例 (寄与度分解の図表構成を参考)
- [内閣府 地域課題分析レポート 図表 3-4](https://www5.cao.go.jp/j-j/cr/cr24-1/img/chr24-1_03-04z.html) — 政策文書での地域差指数可視化の参考レイアウト
- [統計局: 家計調査年報 2024](https://www.stat.go.jp/data/kakei/2024np/index.html) — 補助情報。「物価指数 × 消費支出構成比」で実質生活コストを試算する場合の元データ (Phase 3+ 候補)

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (全 47 県 + 全国) | `consumer-price-difference-index-overall` | 2010-2024 (15 点) | `app/themes/consumer-prices/timeseries/overall-by-prefecture.json` | 小売物価統計調査(構造編) |
| timeseries (national + 上下位 県) | `consumer-price-difference-index-overall-excl-rent` | 2010-2024 | `app/themes/consumer-prices/timeseries/overall-excl-rent.json` | 同上 |
| breakdown (bar) | overall 配下の 10 大費目 | 2024 | `app/themes/consumer-prices/breakdown/by-category.json` | 同上 (10 大費目 × 47 県マトリクス) |
| breakdown (national) | 家計調査の消費支出 品目別構成比 | 2024 | `app/themes/consumer-prices/breakdown/expenditure-share.json` | 家計調査 年報 (将来「指数 × 構成比」加重平均試算用) |

**統合 JSON 案** (1 fetch で全 chart データを取れる構成):

```json
{
  "themeKey": "consumer-prices",
  "timeseries": {
    "overall-by-prefecture": { "years": [...], "series": [...] },
    "overall-excl-rent": { ... }
  },
  "breakdown": {
    "by-category": { "categories": [10 費目], "prefectures": [...] },
    "expenditure-share": { "items": [{ "label": "食料", "share": 0.26 }, ...] }
  }
}
```

→ `app/themes/consumer-prices/charts.json` 1 ファイル統合を Phase 3 で判断。

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `consumer-price-housing-gap-ratio` (住居費 対全国倍率) | 住居だけが 1.56 倍格差で全費目中圧倒的に大きい事実を 1 指標化 (東京 127.2 / 岐阜 81.3 = 1.56) | 既存 `housing` 指数から派生計算可 (新規取得不要) |
| `consumer-price-excl-rent-gap` (家賃除き格差) | 「家賃を除けば物価格差は半減」curiosity gap を強化する派生指標 | 既存 `overall-excl-rent` から派生 |
| `real-purchasing-power-index` (実質購買力指数) | 都道府県別 賃金 ÷ 地域差指数 で「実質的に豊かな県」ランキング (名目では東京 1 位、実質では別県という意外性) | 賃金構造基本統計調査 × 本指数の組合せ (新規スキル化候補) |

住居費倍率は **特に強い curiosity gap** (「住居だけ別世界」) を作れるので最優先で追加候補。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実 (`.claude/rules/blog-quality-standards.md` 準拠):

1. **「物価最高 東京 104.0 vs 最低 群馬 96.2、なぜ 8 ポイントしか違わない?」** — 体感より小さい格差の意外性
2. **「住居だけは東京の方が 1.56 倍、他の費目はほぼ揃っている」** — 費目別の極端な偏り
3. **「家賃を除けば物価格差は半減、東京の真のコストは住居が 9 割」** — 寄与度分解の逆説
4. **「光熱水道は北海道が高い、食料は群馬が安い、費目別 1 位は意外な県」** — 費目ごとに 1 位が変わる事実

theme description (D1 themes.description) を以下に書き換え推奨:

> 「物価最高の東京 (104.0) と最低の群馬 (96.2) は 8 ポイント差──だが住居だけは 1.56 倍格差。47 都道府県の消費者物価地域差指数を 10 大費目別に地図とランキングで比較。」

## 7. 残課題 / 要検証

- [ ] e-Stat `statsDataId` (10 大費目 × 都道府県マトリクス) を `/inspect-estat-meta` で確認。`0000100123` 系列が現行か、2024 年版で更新されたか
- [ ] 時系列の連続性: 2020 年基準改定で系列が切れていないか (基準年変更による断絶チェック)
- [ ] `consumer-price-difference-index-overall-excl-rent` (家賃除く総合) が e-Stat で別系列として配信されているか、それとも計算派生か
- [ ] 「10 大費目別 bar」のチャート種別 — 既存 chart_type に `diverging-bar` (正負両方向) が無ければ既存 `bar` で代替するか、新規追加要否
- [ ] 家計調査の品目別構成比は本テーマに統合するか、別テーマ (real-income) と分担するか — overlap 整理
- [ ] 住居指数で東京 127.2 / 岐阜 81.3 の差は **家賃が主因か持ち家帰属家賃の影響か** を寄与度分解 (Phase 3 設計時)

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- 見本: [`living-housing.md`](./living-housing.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/consumer-prices.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-plan.md`

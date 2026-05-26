---
type: theme-chart-planning
date: 2026-05-26
theme_key: local-finance
status: drafted
research_sources:
  - https://www.soumu.go.jp/menu_seisaku/hakusyo/chihou/r06data/2024data/r06czs00-00.html
  - https://www.soumu.go.jp/iken/ruiji/todohuken_r05.html
  - https://www.soumu.go.jp/menu_seisaku/toukei/02zaisei07_04000131.html
  - https://www.nippon.com/ja/japan-data/h01085/
  - https://www.moving-take.com/doc/rank_zaisei_states.html
  - https://www.soumu.go.jp/iken/zaisei/r05data/2023data/r05020201.html
tags: [theme-charts, local-finance]
---

# 地方財政 (local-finance) — チャート構成設計

## 0. 結論サマリ

左コロプレスで「財政力指数」(2024 年度) を地図表示、右に **(A) 全国平均推移 line (財政力指数の 2005→2024、不交付団体数の併走)**、**(B) 歳入構成 pie (選択県の地方税/交付税/国庫支出金/地方債、デフォルトは全国)**、**(C) 上下位 5 県 bar (東京 1.21 vs 島根 0.27、4.4 倍格差)** の 3 枚を縦に積む。歳出構造タブには「目的別歳出 pie」、税収・所得タブには「課税所得の全国推移 line」を追加。

## 1. 既存 metric 棚卸し

18 metrics をサブカテゴリで整理。primary は `fiscal-strength-index-prefecture`。

| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |
|---|---|---|---|---|---|---|
| `fiscal-strength-index-prefecture` | 財政力指数 | primary | 財政健全度 | choropleth + line + bar | prefecture / national | 地方財政状況調査 (年次, 1956-) |
| `current-balance-ratio` | 経常収支比率 | secondary | 財政健全度 | choropleth + line | prefecture / national | 同上 |
| `real-public-debt-service-ratio` | 実質公債費比率 | secondary | 財政健全度 | choropleth + line | prefecture / national | 同上 |
| `future-burden-ratio` | 将来負担比率 | secondary | 財政健全度 | choropleth | prefecture | 健全化判断比率 (2007-) |
| `real-balance-ratio` | 実質収支比率 | secondary | 財政健全度 | choropleth | prefecture | 地方財政状況調査 |
| `local-tax-ratio-pref-finance` | 地方税割合 | secondary | 歳入構造 | choropleth + line | prefecture / national | 同上 |
| `local-allocation-tax-ratio-pref-finance` | 交付税割合 | secondary | 歳入構造 | choropleth + line | prefecture / national | 同上 |
| `national-treasury-disbursement-ratio-pref-finance` | 国庫支出金割合 | secondary | 歳入構造 | choropleth | prefecture | 同上 |
| `self-financing-ratio` | 自主財源割合 | secondary | 歳入構造 | choropleth + bar | prefecture | 同上 |
| `per-capita-total-expenditure-pref-municipal` | 1人当たり歳出 | secondary | 歳出構造 | choropleth + bar | prefecture | 同上 |
| `personnel-expenditure-ratio-pref-finance` | 人件費割合 | secondary | 歳出構造 | choropleth | prefecture | 性質別歳出 |
| `welfare-expenditure-ratio-pref-finance` | 民生費割合 | secondary | 歳出構造 | choropleth + line | prefecture / national | 目的別歳出 |
| `education-expenditure-ratio-pref-finance` | 教育費割合 | secondary | 歳出構造 | choropleth | prefecture | 同上 |
| `public-works-expenditure-ratio-pref-finance` | 土木費割合 | secondary | 歳出構造 | choropleth + line | prefecture / national | 同上 |
| `per-capita-inhabitant-tax-pref-municipal` | 住民税 | secondary | 税収・所得 | choropleth + bar | prefecture | 市町村税課税状況等の調 |
| `per-taxpayer-taxable-income` | 課税所得 | secondary | 税収・所得 | choropleth + line | prefecture / national | 同上 |
| `taxpayer-ratio-per-pref-resident` | 納税義務者割合 | secondary | 税収・所得 | choropleth | prefecture | 同上 |
| `laspeyres-index-prefecture` | ラスパイレス指数 | secondary | 税収・所得 | choropleth | prefecture | 地方公務員給与実態調査 |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `fiscal-strength-index-prefecture` (財政力指数, 2024 年度)

- 配色: 発散カラースケール、全国平均 0.49378 を白、1.0 (財政自立ライン) を境に青/赤
- ホバー: 県名 + 財政力指数 + 全国順位 + 「不交付/交付」バッジ

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 全国推移ライン

**何を見せるか**: 都道府県平均財政力指数の推移 (2005-2024, 年次) + 不交付団体数の併走線

- curiosity gap: **「不交付の都道府県は 1954 年以来 70 年間ずっと東京 1 つ」**
- データ源: 地方財政状況調査 (全国集計)
- 必要データ: `app/themes/local-finance/timeseries/fiscal-strength-index.json`
  ```json
  { "metricKey": "fiscal-strength-index-prefecture", "scope": "national",
    "unit": "指数", "series": [{ "year": 2005, "value": 0.46, "non_recipient_count": 1 }, ..., { "year": 2024, "value": 0.494, "non_recipient_count": 1 }] }
  ```

#### (B) 歳入構成パイチャート

**何を見せるか**: 選択県 (デフォルト全国) の歳入内訳

| 区分 | 全国構成比 (2022 年度概算) |
|---|---|
| 地方税 | 約 33% |
| 地方交付税 | 約 17% |
| 国庫支出金 | 約 18% |
| 地方債 | 約 11% |
| その他 | 約 21% |

- curiosity gap: 東京 = 地方税 70%+ / 交付税 0%、島根 = 地方税 20% / 交付税 35%+ で **構造が真逆**
- データ源: 地方財政状況調査 都道府県分歳入内訳 (e-Stat sid=0003173301)
- 必要データ: `app/themes/local-finance/breakdown/revenue-composition.json`
  ```json
  { "metricKey": "local-tax-ratio-pref-finance", "breakdown_dimension": "歳入区分",
    "year": 2022, "scope_options": ["national", "prefecture"],
    "items_by_scope": { "national": [{ "label": "地方税", "ratio": 0.33 }, ...] } }
  ```
- 都道府県切替トグル付き

#### (C) 上下位 5 県バーチャート

**何を見せるか**: 財政力指数 TOP 5 + BOTTOM 5 (2024 年度)

```
東京都   1.21 ▰▰▰▰▰▰▰▰▰▰▰▰ (唯一 1.0 超え=不交付)
愛知県   0.88 ▰▰▰▰▰▰▰▰▰
神奈川県 0.86 ▰▰▰▰▰▰▰▰▰
大阪府   0.75 ▰▰▰▰▰▰▰▰
千葉県   0.75 ▰▰▰▰▰▰▰▰
─ 全国平均 0.49 ─
和歌山県 0.33 ▰▰▰
秋田県   0.33 ▰▰▰
鳥取県   0.28 ▰▰▰
高知県   0.27 ▰▰▰
島根県   0.27 ▰▰▰
```

- choropleth と同じ `app/ranking/fiscal-strength-index-prefecture/values.json` から派生

### 2-3. パネルタブ — 既存維持 + 補助チャート追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **財政健全度** | fiscal-strength-index / current-balance / real-public-debt-service / future-burden / real-balance | line: 全国平均経常収支比率の推移 (硬直化を可視化、90%超は危険水準)<br>line: 実質公債費比率の推移 (財政健全化法施行 2007 以降の改善トレンド) |
| **歳入構造** | local-tax / local-allocation-tax / national-treasury / self-financing | pie: 歳入区分別 (上記 B、tab 内でも表示)<br>line: 自主財源割合の全国推移 (40-45% 帯) |
| **歳出構造** | per-capita-expenditure / personnel / welfare / education / public-works | pie: 目的別歳出 (民生費 / 教育費 / 土木費 / 公債費 / 総務費 / その他、民生費が 1990 年 13% → 2022 年 27% に倍増)<br>line: 民生費割合の全国推移 (高齢化で上昇) / 土木費割合の全国推移 (公共事業削減で低下) |
| **税収・所得** | per-capita-inhabitant-tax / per-taxpayer-taxable-income / taxpayer-ratio / laspeyres-index | line: 課税所得の全国推移 (デフレ期停滞 → 2013 以降緩やかに上昇)<br>bar: 1 人当たり住民税の都道府県格差 (東京 vs 沖縄 で 2 倍超) |

## 3. 参考にしたサイト (リサーチ結果)

- [総務省: 令和6年版 地方財政白書 資料編](https://www.soumu.go.jp/menu_seisaku/hakusyo/chihou/r06data/2024data/r06czs00-00.html) — 公式の代表チャート構成 (歳入歳出構成比の円グラフ + 年次推移の積み上げ縦棒)
- [総務省: 令和5年度都道府県財政指数表](https://www.soumu.go.jp/iken/ruiji/todohuken_r05.html) — 47 都道府県の財政力指数・経常収支比率・実質公債費比率を一覧化した公式ソース
- [総務省: 主要財政指標一覧](https://www.soumu.go.jp/menu_seisaku/toukei/02zaisei07_04000131.html) — 年度別の Excel ダウンロード窓口、Phase 3 で活用
- [Nippon.com: 地方交付税、全政令市が「交付」の対象に](https://www.nippon.com/ja/japan-data/h01085/) — 不交付団体数の年次変動を扱う典型例、「東京都が唯一の不交付県」を curiosity gap として打ち出すパターン
- [TAKE引越センター: 2024 年都道府県別財政力指数ランキング](https://www.moving-take.com/doc/rank_zaisei_states.html) — TOP5/BOTTOM5 数値の確認 (東京 1.21 vs 島根 0.27)
- [総務省: 令和5年版地方財政白書ビジュアル版 歳入内訳](https://www.soumu.go.jp/iken/zaisei/r05data/2023data/r05020201.html) — 歳入構成 pie のレイアウト見本

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (national) | `fiscal-strength-index-prefecture` | 2005-2024 (年次) | `app/themes/local-finance/timeseries/fiscal-strength-index.json` | 地方財政状況調査 全国平均 |
| timeseries (national) | `current-balance-ratio` | 2005-2024 | `app/themes/local-finance/timeseries/current-balance-ratio.json` | 同上 |
| timeseries (national) | `real-public-debt-service-ratio` | 2007-2024 | `app/themes/local-finance/timeseries/real-public-debt-service-ratio.json` | 健全化判断比率 |
| timeseries (national) | `welfare-expenditure-ratio-pref-finance` | 1990-2022 | `app/themes/local-finance/timeseries/welfare-expenditure-ratio.json` | 目的別歳出 |
| timeseries (national) | `public-works-expenditure-ratio-pref-finance` | 1990-2022 | `app/themes/local-finance/timeseries/public-works-expenditure-ratio.json` | 同上 |
| timeseries (national) | `per-taxpayer-taxable-income` | 2005-2023 | `app/themes/local-finance/timeseries/per-taxpayer-taxable-income.json` | 市町村税課税状況等の調 |
| breakdown (pie) | 歳入構成 | 2022, 全国 + 県別 | `app/themes/local-finance/breakdown/revenue-composition.json` | 地方財政状況調査 都道府県分歳入 (e-Stat sid=0003173301) |
| breakdown (pie) | 目的別歳出 | 2022, 全国 + 県別 | `app/themes/local-finance/breakdown/expenditure-purpose.json` | 同上 歳出 |
| breakdown (pie) | 性質別歳出 | 2022, 全国 + 県別 | `app/themes/local-finance/breakdown/expenditure-nature.json` | 同上 (人件費 / 物件費 / 扶助費 / 補助費 / 公債費 / 投資的経費) |

**統合 JSON 案** (1 fetch で複数 chart データを取れる構成):

```json
{
  "themeKey": "local-finance",
  "timeseries": {
    "fiscal-strength-index-prefecture": { "scope": "national", "unit": "指数", "series": [...] },
    "welfare-expenditure-ratio-pref-finance": { ... },
    "per-taxpayer-taxable-income": { ... }
  },
  "breakdown": {
    "revenue-composition": { "label": "歳入区分", "items_by_scope": {...} },
    "expenditure-purpose": { "label": "目的別歳出", "items_by_scope": {...} }
  }
}
```

→ `app/themes/local-finance/charts.json` 1 ファイル統合を Phase 3 設計時に判断。

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `non-recipient-status` (不交付団体フラグ) | 真偽値だが「都道府県で唯一の不交付=東京」という 70 年継続の事実は強い curiosity gap。choropleth で 1 県だけ赤く塗れる | 総務省 普通交付税算定結果 (年次) |
| `bond-dependency-ratio` (地方債依存度) | 歳入に占める地方債の比率。普通建設事業の活発な県と低い県で 2 倍以上差。財政健全度の補助指標 | 地方財政状況調査 (e-Stat sid=0003173301) |
| `effective-tax-revenue-per-capita` (1 人当たり実質地方税収) | 住民税 + 事業税 + 固定資産税を合算した県の税収力。東京 vs 沖縄で 3 倍超の格差 | 地方財政状況調査 |

特に **不交付団体フラグ**は「東京 1 県だけ」というインパクトで地図上の意味性が極めて高く、最優先で追加候補。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実 (`.claude/rules/blog-quality-standards.md` 準拠):

1. **「財政力指数 東京 1.21 vs 島根 0.27、4.4 倍格差──唯一『自立』できる都道府県は」** — 倍率 + 唯一性
2. **「東京都は 1954 年以来 70 年間ずっと不交付、なぜ他県は追いつけない?」** — 時間軸 + 疑問形
3. **「島根県は歳入の 1/3 以上が地方交付税、地方税は 20% 弱──歳入構造が東京と真逆」** — 比較対比
4. **「民生費は 1990 年 13% → 2022 年 27% に倍増、高齢化が県財政を再構築した」** — 構造変化

theme description (D1 themes.description) 改訂推奨:

> 「財政力指数 東京 1.21 vs 島根 0.27 で 4.4 倍格差、不交付の都道府県は 1954 年以降ずっと東京 1 つ──47 都道府県の地方税・交付税依存度・歳出構造を地図とランキングで比較。」

## 7. 残課題 / 要検証

- [ ] 歳入構成・目的別歳出の e-Stat statsDataId が 47 都道府県 × 各区分の matrix で取れるか確認 (e-Stat sid=0003173301 の `cdCat` 構造を `/inspect-estat-meta` で確認)
- [ ] 「不交付団体」フラグは e-Stat にデータが無く総務省 PDF 抽出が必要 → 年次手動更新スキル化検討
- [ ] 財政力指数の全国平均は単純平均か加重平均か (都道府県平均 = 0.49 ⇄ 加重では別値) — 既存値と整合性確認
- [ ] 健全化判断比率 (実質公債費比率 / 将来負担比率) は 2007 年以降のみ取得可、それより前は欠損として扱う
- [ ] 上下位 5 県バーは独立 chart_type か choropleth コンポーネントの補助 UI か (frontend 設計判断、living-housing と統一)

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- 見本: [`living-housing.md`](./living-housing.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/local-finance.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-d1-migration.md`

---
type: theme-chart-planning
date: 2026-05-26
theme_key: local-economy
status: drafted
research_sources:
  - https://www.esri.cao.go.jp/jp/sna/sonota/kenmin/kenmin_top.html
  - https://www.esri.cao.go.jp/jp/sna/data/data_list/kenmin/files/contents/main_2022.html
  - https://eleminist.com/article/4322
  - https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/minimumichiran/index.html
  - https://www.jil.go.jp/kokunai/statistics/shuyo/0210.html
  - https://www.soumu.go.jp/iken/shihyo_ichiran.html
tags: [theme-charts, local-economy]
---

# 地域経済 (local-economy) — チャート構成設計

## 0. 結論サマリ

左コロプレスで **「1人当たり県民所得」(2022 年度最新、東京 603.7 万円 vs 沖縄 224.9 万円で約 2.7 倍格差)** を地図表示、右に **(A) 全国推移ライン (1人当たり県民所得 + 最低賃金 全国加重平均)**、**(B) 県民所得の構成比パイ (雇用者報酬/財産所得/企業所得)**、**(C) 上下位 5 県バー (東京 vs 沖縄)** の 3 枚を縦に積む。GDP・所得/雇用/産業/財政の各タブに全国推移ラインを追加。

## 1. 既存 metric 棚卸し

| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |
|---|---|---|---|---|---|---|
| `per-taxpayer-taxable-income` | 課税所得 | primary | GDP・所得 | choropleth + bar | prefecture | 市町村税課税状況等の調 (年次) |
| `prefectural-income-per-capita` | 1人当たり県民所得 | secondary | GDP・所得 | choropleth + line + bar | prefecture / national | 内閣府 県民経済計算 (年度、2022 が最新) |
| `minimum-wage-by-region` | 最低賃金 | secondary | GDP・所得 | choropleth + line | prefecture / national | 厚労省 地域別最低賃金 (年次、2025=1,121円) |
| `active-job-opening-ratio` | 有効求人倍率 | secondary | 雇用 | choropleth + line | prefecture / national | 厚労省 一般職業紹介状況 (月次/年平均) |
| `unemployment-rate` | 失業率 | secondary | 雇用 | choropleth + line | prefecture / national | 労働力調査 (年平均) |
| `fiscal-strength-index-prefecture` | 財政力指数 | secondary | 財政・地価 | choropleth + bar | prefecture | 総務省 地方財政状況調査 (年次) |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `prefectural-income-per-capita` (1人当たり県民所得、2022 年度)

- 配色: 青系の連続スケール (高いほど濃青、全国平均約 320 万円を中央)
- ホバー時: 県名 + 1人当たり県民所得 (万円) + 全国順位
- primary には `per-taxpayer-taxable-income` (課税所得) を据え置く案もあるが、ヘッドラインは「県民所得」の方が一般読者に伝わるため secondary を昇格表示

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 全国推移ライン

**何を見せるか**: 全国の 1人当たり県民所得 + 最低賃金 全国加重平均の年次推移 (2002-2025)

- データ源: 内閣府 県民経済計算 (全国合計) + 厚労省 最低賃金推移
- curiosity gap: **「最低賃金は 663円 (2002) → 1,121円 (2025) で 1.7 倍、県民所得は約 300 万円台で横ばい」** をタイトルで打ち出す
- 必要データ: `app/themes/local-economy/timeseries/income-and-min-wage.json`
  ```json
  { "metricKeys": ["prefectural-income-per-capita", "minimum-wage-by-region"],
    "scope": "national", "series": [{ "year": 2002, "income": 290, "minWage": 663 }, ...] }
  ```

#### (B) 県民所得の構成比パイチャート

**何を見せるか**: 県民所得 (=分配側 NI) の **3 区分内訳**

| 区分 | 全国シェア | 解説 |
|---|---|---|
| 県民雇用者報酬 | 約 72% | 賃金 + 社会保険料事業主負担 |
| 財産所得 (非企業部門) | 約 5% | 利子・配当・賃貸料 |
| 企業所得 | 約 23% | 法人企業 + 個人企業 + 公的企業の営業余剰 |

- データ源: 内閣府 県民経済計算「県民所得・分配」表
- 必要データ: `app/themes/local-economy/breakdown/prefectural-income-composition.json`
  ```json
  { "metricKey": "prefectural-income-per-capita", "breakdown_dimension": "所得分配",
    "year": 2022, "items": [{ "label": "雇用者報酬", "value": ..., "ratio": 0.72 }, ...] }
  ```
- 都道府県切替トグル付き (デフォルト全国、選択で県別構成。製造業県は企業所得比率が高いなど特徴が出る)

#### (C) 上下位 5 県バーチャート

**何を見せるか**: 1人当たり県民所得 TOP 5 + BOTTOM 5 (2022 年度)

```
東京都    603.7 万円 ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰
愛知県    381.9 万円 ▰▰▰▰▰▰▰▰▰▰
茨城県    348.1 万円 ▰▰▰▰▰▰▰▰▰
群馬県    346.7 万円 ▰▰▰▰▰▰▰▰▰
和歌山県  337.5 万円 ▰▰▰▰▰▰▰▰▰
─ 全国平均 約 320 万円 ─
長崎県    257.0 万円 ▰▰▰▰▰▰
岡山県    255.3 万円 ▰▰▰▰▰▰
鳥取県    249.1 万円 ▰▰▰▰▰▰
宮崎県    245.3 万円 ▰▰▰▰▰▰
沖縄県    224.9 万円 ▰▰▰▰▰
```

- choropleth と同じ `app/ranking/prefectural-income-per-capita/values.json` から派生
- 別途 export 不要

### 2-3. パネルタブ — 既存維持 + 補助チャート追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **GDP・所得** | per-taxpayer-taxable-income / minimum-wage-by-region (+ prefectural-income-per-capita) | line: 最低賃金 全国加重平均の推移 (2002 663円 → 2025 1,121円、1.7倍)<br>bar: 2025 最低賃金 上下位 5 県 (東京 1,226円 vs 高知/宮崎/沖縄 1,023円) |
| **雇用** | active-job-opening-ratio / unemployment-rate | line: 全国有効求人倍率の推移 (リーマン 0.42 → 2025 1.19)<br>bar: 2025 有効求人倍率 上下位 5 県 (福井 1.84 vs 北海道/神奈川など) |
| **産業** | (空) | pie: 県内総生産の産業別構成 (第1次/第2次/第3次)、都道府県切替<br>新規 metric `prefectural-gdp` 追加が前提 |
| **財政・地価** | fiscal-strength-index-prefecture | bar: 財政力指数 上下位 5 県 (東京 1.06 唯一の 1.0 超 vs 島根 0.25)<br>line: 全国平均財政力指数の推移 |
| **考察** | (空) | (現状通り、本文記事用) |

## 3. 参考にしたサイト (リサーチ結果)

- [内閣府 県民経済計算 (経済社会総合研究所)](https://www.esri.cao.go.jp/jp/sna/sonota/kenmin/kenmin_top.html) — 公式統計表 (FY2022 が最新公表、2025-08 リリース)。1人当たり県民所得・分配側 NI の構成 (雇用者報酬/財産所得/企業所得) の出典
- [内閣府 県民経済計算 統計表 (平成23-令和4年度)](https://www.esri.cao.go.jp/jp/sna/data/data_list/kenmin/files/contents/main_2022.html) — 47 都道府県 × 11 年度のロー JSON/CSV ダウンロード元
- [Eleminist: 2025年版 県民所得＆1人あたり県民所得ランキング](https://eleminist.com/article/4322) — 1人当たり県民所得 TOP/BOTTOM 5 の curiosity gap 表現 (「東京 603.7 万円 vs 沖縄 224.9 万円」)
- [厚労省 地域別最低賃金の全国一覧](https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/minimumichiran/index.html) — 2025年度 全国加重平均 1,121円、初の全47都道府県 1,000円超。最高 東京 1,226 vs 最低 高知/宮崎/沖縄 1,023円
- [JILPT 都道府県別有効求人倍率 (主要労働統計指標)](https://www.jil.go.jp/kokunai/statistics/shuyo/0210.html) — 2025年 就業地別 福井 1.84 が全国最高、東京 1.73、香川 1.62 の典型レイアウト (line + 県別 bar)
- [総務省 地方公共団体の主要財政指標一覧](https://www.soumu.go.jp/iken/shihyo_ichiran.html) — 財政力指数の公式出典。2024 年データで東京 1.06 が唯一の 1.0 超

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (national) | `prefectural-income-per-capita` | 1990-2022 (年度) | `app/themes/local-economy/timeseries/prefectural-income-per-capita.json` | 内閣府 県民経済計算 全国集計 |
| timeseries (national) | `minimum-wage-by-region` | 2002-2025 | `app/themes/local-economy/timeseries/minimum-wage-national.json` | 厚労省 最低賃金 全国加重平均 |
| timeseries (national) | `active-job-opening-ratio` | 1963-2025 | `app/themes/local-economy/timeseries/active-job-opening-ratio.json` | 厚労省 一般職業紹介状況 |
| timeseries (national) | `unemployment-rate` | 1953-2025 | `app/themes/local-economy/timeseries/unemployment-rate.json` | 総務省 労働力調査 |
| timeseries (national) | `fiscal-strength-index-prefecture` | 2001-2024 | `app/themes/local-economy/timeseries/fiscal-strength-index.json` | 総務省 地方財政状況調査 |
| breakdown (pie) | `prefectural-income-per-capita` | 2022 | `app/themes/local-economy/breakdown/prefectural-income-composition.json` | 県民経済計算 分配側 NI (雇用者報酬/財産所得/企業所得) |
| breakdown (pie) | `prefectural-gdp` (新規) | 2022 | `app/themes/local-economy/breakdown/gdp-by-industry.json` | 県民経済計算 生産側 県内総生産 (第1-3次産業) |

**統合 JSON 案** (1 fetch で複数 chart データ):

```json
{
  "themeKey": "local-economy",
  "timeseries": {
    "prefectural-income-per-capita": { "scope": "national", "unit": "万円", "series": [...] },
    "minimum-wage-by-region": { "scope": "national", "unit": "円", "series": [...] },
    "active-job-opening-ratio": { ... }
  },
  "breakdown": {
    "prefectural-income-composition": { "label": "県民所得 分配", "items": [...] },
    "gdp-by-industry": { "label": "県内総生産 産業別", "items": [...] }
  }
}
```

→ `app/themes/local-economy/charts.json` 1 ファイルにまとめる方が fetch 回数が減る。Phase 3 設計時に判断。

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `prefectural-gdp-per-capita` (1人当たり県内総生産) | 県民所得 (居住地主義) と県内総生産 (生産地主義) の乖離が東京/愛知で顕著。GDP 視点も併置で curiosity gap 強化 | 内閣府 県民経済計算 (生産側) |
| `gdp-share-tertiary-industry` (第3次産業 GDP シェア) | 東京 90% 超 vs 工業県・農業県との対比が明快。産業構造タブの primary 候補 | 同上 |
| `local-tax-revenue-per-capita` (1人当たり地方税収) | 財政力指数の補完。「東京の住民税収は地方の何倍か」を直感化 | 総務省 地方財政状況調査 |
| `corporate-business-establishments` (民営事業所数) | 産業タブが完全に空のため、最低 1 つは経済規模 metric が必要 | 経済センサス |

特に **`prefectural-gdp-per-capita`** と **`gdp-share-tertiary-industry`** は産業タブを成立させるために優先追加候補。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実 (`.claude/rules/blog-quality-standards.md` 準拠):

1. **「1人当たり県民所得は東京 603.7 万円 vs 沖縄 224.9 万円、2.7 倍格差 (2022)」** — 倍率 + 意外性
2. **「最低賃金は 23 年で 663円 → 1,121円 (1.7倍)、初の全 47 都道府県 1,000円超」** — 構造変化の数値化
3. **「財政力指数 1.0 超は東京だけ──46 道府県は交付税頼み、なぜ自立できないのか?」** — 疑問形 + 唯一
4. **「有効求人倍率トップは福井 1.84、東京は 1.73 で 2 位──地方が人手不足」** — 逆説 (大都市 ≠ 求人最多)

theme description (D1 themes.description) 書き換え推奨:

> 「1人当たり県民所得は東京 603.7 万円 vs 沖縄 224.9 万円で 2.7 倍格差、最低賃金は 2025 年に全 47 都道府県で 1,000円超──47 都道府県の所得・雇用・財政を地図とランキングで比較。」

## 7. 残課題 / 要検証

- [ ] 内閣府 県民経済計算の e-Stat statsDataId を `/inspect-estat-meta` で確認 (生産側 GDP / 分配側 NI / 支出側で別 ID)。年度更新タイミングは毎年 8 月頃
- [ ] 分配側 NI 内訳 (雇用者報酬/財産所得/企業所得) が `cdCat01` 等で都道府県別に取れるか確認
- [ ] 最低賃金の時系列 (2002-2025) は e-Stat ではなく厚労省 Excel スクレイプの可能性 → 別スキル化候補
- [ ] 1人当たり県民所得の Eleminist 順位は 40 県のみ (福井/奈良/栃木/徳島/長野/静岡/香川は欠損表記)。内閣府原データで 47 県揃うか要確認
- [ ] `prefectural-income-per-capita` が現状 secondary だが、ヘッドラインで使うなら primary に昇格 (TS 修正) を検討
- [ ] 産業タブが metric ゼロ。`prefectural-gdp` 系を最低 1 つ Phase 2 内に追加しないとタブが空のまま

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- 見本ファイル: [`living-housing.md`](./living-housing.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/local-economy.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-d1-migration.md`

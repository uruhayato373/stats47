---
type: implementation-plan
date: 2026-05-29
status: active
tags: [theme-dashboard, page-components, charts]
---

# テーマダッシュボード データ・チャート提案（全21テーマ）

`/themes/<key>` のフル幅ダッシュボード（`ThemeMetricsDashboard`）で表示する **KPI カード** と
**チャート** の提案。2026-05-29 のダッシュボード化に合わせて整理。

## 前提（今回の設計変更）

- **KPI カードは自動生成**: `tabIndicators`（role≠context の指標）を `indicatorDataMap` から導出。
  県選択時は値・全国順位・全国平均比、未選択時は全国平均。→ **KPI は page_components 不要**。
- **チャートは page_components（pageType="theme"）**: `ThemeDbChartRenderer` 対応の
  **7 タイプのみ**使用可能 — `line-chart` / `mixed-chart` / `composition-chart` /
  `donut-chart` / `pyramid-chart` / `cpi-profile` / `cpi-heatmap`（+ `markdown-section`）。
- **section は無視**（フラット配置）。`estatParams` は `packages/data-configs/src/metrics/<key>.ts`
  の `source`（statsDataId / cdCat01）を転記する（手入力の推測値は禁止）。
- データ取得は `fetchEstatData`（県別）/ 全国は47県平均。`/areas/[code]` と同じ runtime 経路で描画。

## チャートタイプ選択の決定木

| データの性質 | 推奨タイプ |
|---|---|
| 単一指標の推移 / 2〜3 指標の同単位推移 | `line-chart` |
| 件数 + 率（異単位の二軸） | `mixed-chart` |
| 内訳の構成比 + 推移（歳入・産業別等） | `composition-chart` |
| ある年の構成比スナップショット（魚種別等） | `donut-chart` |
| 年齢×性別の人口構造 | `pyramid-chart` |
| 物価10大費目（地域差指数） | `cpi-profile` / `cpi-heatmap` |

---

## 実装ステータス凡例

- ✅ **実装済（今回）** — 2026-05-29 に R2 反映 + seed スクリプト追加
- 🟢 **充足** — 既存チャートで十分（変更不要）
- 🟡 **将来拡充候補** — 既存はあるが追加余地あり
- 🔴 **要対応** — チャート 0 件 / 粒度課題

---

## 1. 充足している / 拡充候補のテーマ（既存チャートあり）

| テーマ | 既存チャート | 評価 | 追加提案（将来） |
|---|---|---|---|
| population-dynamics | 出生率死亡率 / 自然社会増減 / 年齢3区分構成 / 人口ピラミッド / 社会増減超過率 (5) | 🟢 | 昼夜間人口比率の推移（line） |
| aging-society | 高齢化率・出生率 ほか 10 | 🟢 | — |
| local-economy | 産業別就業構成(donut) / 課税所得最低賃金 / 求人倍率失業率(mixed) (3) | 🟢 | 県民所得の推移（line） |
| labor-wages | 男女賃金格差 / 最低賃金 / 求人倍率失業率 (3) | 🟡 | 初任給（大卒・高卒）の推移（line）、テレワーク率の推移 |
| manufacturing | 事業所数従業者数 / 出荷額付加価値額 (2) | 🟡 | 1人当たり・1事業所当たり出荷額（line）、工業地価（line） |
| healthcare | 医師病院数 / 1人当たり医療費 / 生活習慣病死亡健診 (3) | 🟢 | 病床利用率・平均在院日数（line） |
| safety | 刑法犯検挙率(mixed) / 交通事故 / 火災救急 / 自殺事故死 (4) | 🟢 | 高齢者交通事故の推移（line） |
| education-culture | 学校数 / 文化施設数 (2) | 🟡 | 図書館・公民館数の推移（line）、考察 markdown 追加 |
| tourism | 宿泊者数（日外）/ 航空旅客 (2) | 🟡 | 客室稼働率の推移（line）、国内旅行参加率（line） |
| consumer-prices | 物価プロファイル / 生活費地域差 / 物価ヒートマップ (3) | 🟢 | — |
| foreign-residents | 外国人比率数 / 国籍別 / 外国人宿泊 (3) | 🟢 | 在留外国人の推移（line） |
| occupation-salary | 職種別年収 ×5 (5) | 🟢 | — |
| real-income | 可処分所得 / 物価地域差 (2) | 🟡 | 家賃控除後手残り（line）、実収入（line） |
| labor-mobility | テレワーク副業 / 離職転職 (2) | 🟡 | 求人倍率・失業率の推移（line） |
| local-finance | 財政力・歳入歳出構成 ほか (8) | 🟢 | — |
| fishery-marine | 漁獲量・養殖・産出額・魚種別 ほか (6) | 🟢 | — |

> 上記 16 テーマは **既存チャートで成立**。🟡 は本ファイルを backlog として将来 `seed` 追加する。

---

## 2. 今回実装したテーマ（✅）

R2（`app/page-components/theme/<key>.json`）へ反映済 + `apps/web/scripts/theme-page-component-additions.ts` に定義。

### living-housing（暮らし・住まい）＋3

| componentKey | type | 指標 | statsDataId/cat |
|---|---|---|---|
| lh-dwelling-floor-area-trend | line | 1住宅当たり延べ面積 | 0000020308 / #H02103 |
| lh-marriage-divorce-trend | line | 婚姻件数・離婚件数 | 0000010101 / A9101・A9201 |
| lh-pop-density-trend | line | 可住地人口密度 | 0000010201 / #A01202 |

（既存: 空き家率と持ち家率の推移 / 未婚率と高齢夫婦世帯率の推移 + 考察 markdown ×3）

### ports（港湾）🔴→✅ 新規

| componentKey | type | 指標 | statsDataId/cat |
|---|---|---|---|
| ports-cargo-trend | line | 輸出入 海上貨物量 | 0003130738 / 110・120 |
| ports-container-trend | line | コンテナ取扱個数 | 0003130688 / 100 |
| ports-passengers-trend | line | 港湾旅客数 | 0003130737 / 100 |

### railway（鉄道）🔴→✅ 新規

| componentKey | type | 指標 | statsDataId/cat |
|---|---|---|---|
| railway-passenger-trend | line | 鉄道輸送人員（JR・民鉄） | 0000010103 / C3704・C3705 |
| railway-freight-trend | line | JR貨物発送量 | 0000010103 / C3702 |

（railway-passengers / railway-station-count は外部ソース（kind=external）のため line-chart 不可 → KPI カードのみ）

### roads（道路）🔴→✅ 新規

| componentKey | type | 指標 | statsDataId/cat |
|---|---|---|---|
| roads-length-trend | line | 道路実延長・高速道路延長 | 0000010108 / H711001・H7113 |
| roads-density-trend | line | 道路密度（可住地面積当たり） | 0000010208 / #H06401 |
| roads-traffic-trend | line | 道路平均交通量 | 0000010208 / #H06413 |

（道の駅数 roadside-station-count は外部ソースのため除外。roads は別途 `ThemeHighwayTimelineSection` も表示）

---

## 3. 要対応（未実装・🔴）

### local-finance-city（市区町村の財政）

- 指標が **市区町村粒度**（fiscal-strength-index / current-balance-ratio-city 等）。
  `ThemeDbChartRenderer` は prefCode（都道府県/全国）でフェッチするため、そのままでは
  時系列が描画できない懸念。専用の cities 静的ページ（`themes/local-finance/cities`）との
  役割整理が必要。
- **対応案**: 市区町村セレクタ付きの専用セクション（local-finance の cities ページに準拠）を
  別途設計。本提案では line-chart 追加を見送り。

---

## 反映フロー（再現手順）

```bash
# ① Mac（ローカルビルド DB がある環境）= SSOT 反映
npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
  apps/web/scripts/seed-theme-page-components.ts
npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
  apps/web/scripts/export-page-components-snapshot.ts   # DB → R2

# ② クラウド/CI（DB 無し）= R2 直接反映（今回実施）
npx tsx apps/web/scripts/sync-theme-additions-to-r2.ts
```

> **重要**: SSOT は Mac のローカルビルド DB。今回はクラウドから R2 へ直接反映したため、
> Mac 側で `seed-theme-page-components.ts` を流して DB にも取り込むこと（流さないと、
> 次に Mac から `export-page-components-snapshot` を実行した際に上書きで消える）。
> 両者は同一定義（`theme-page-component-additions.ts`）から生成され drift しない。

## 検証

- 反映直後は R2 を S3 で直接確認済（living-housing=8 / ports=3 / railway=2 / roads=3）。
- 本番サイトは ISR / R2 reader の in-memory cache のため反映に時間差あり。必要なら
  `/purge-cdn`（storage.stats47.jp）でキャッシュ削除。
- 各チャートが実データを描画するか（特に新規 ports/railway/roads の estat 取得）は
  デプロイ後にブラウザで要確認。データ欠損時は `ThemeDbChartRenderer` が NoData を表示（クラッシュしない）。

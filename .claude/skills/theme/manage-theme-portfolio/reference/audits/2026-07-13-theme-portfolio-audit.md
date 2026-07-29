---
type: theme-portfolio-audit
date: 2026-07-13
status: completed
tags: [theme, portfolio, inventory]
---

# 初回テーマポートフォリオ監査 (PR-2)

`theme-portfolio-manager` 運用 (正典: `.claude/skills/theme/manage-theme-portfolio/reference/テーマポートフォリオ運用.md`) の初回監査。
22 テーマ全件を `.claude/state/themes/portfolio.json` に登録し、ThemeCatalog 登録状況・レビュー文書
(22/22)・`.claude/skills/theme/manage-theme-portfolio/reference/theme-taxonomy-reorganization.md`
の再編案と対応付けた。**計測値 (GSC/GA4) は未集計 (PR-3) のため全テーマ
`insufficient-data`、内部遷移は GA4 未計装のため `not-instrumented`** — 推測値は保存していない。

## 生成方法 (決定的)

- 機械項目: `npx tsx .claude/scripts/themes/build-theme-portfolio.ts` が ThemeCatalog (git TS) /
  legacy IndicatorSet / レビュー文書 frontmatter から再導出 (upsert・意味項目は保持)
- 意味項目 (lifecycleStatus 等): 同スクリプトの `--set` 経由で更新 (手編集禁止)
- 検証: `node .claude/scripts/themes/validate-theme-state.mjs` → **違反 0**

## ポートフォリオ現況 (2026-07-13)

lifecycle 集計: **improve 20 / split-candidate 2** (keep 0 = 全テーマにレビュー提案が未実装で残っている)。
merge/retire 候補は 0 (56 日 measured 実測が無い現段階では validator が構造的に禁止)。

| themeKey | catalog | lifecycle | レビューゲート (frontmatter status) | P/S/C | sel未 | charts |
|---|---|---|---|---|---|---|
| aging-society | ✅ | improve | proposal-ready | 1/6/3 | 7 | 15 |
| climate | **legacy** | improve | ready-after-station-normal-and-observation-method-audit | 2/3/3 | — | — |
| consumer-prices | ✅ | improve | ready-after-content-audit | 1/4/7 | 5 | 6 |
| education-culture | ✅ | **split-candidate** | ready-after-source-and-denominator-audit | 1/4/0 | 5 | 5 |
| fishery-marine | ✅ | improve | ready-after-scope-series-and-coverage-audit | 3/10/11 | 13 | 6 |
| foreign-residents | ✅ | improve | ready-after-definition-and-source-audit | 1/4/5 | 5 | 3 |
| healthcare | ✅ | improve | proposal-ready | 1/5/7 | 6 | 8 |
| labor-mobility | ✅ | improve | ready-after-definition-audit | 1/4/3 | 5 | 6 |
| labor-wages | ✅ | improve | ready-after-definition-audit | 1/6/9 | 7 | 7 |
| living-housing | ✅ | improve | proposal-ready | 1/5/7 | 6 | 9 |
| local-economy | ✅ | improve | **blocked**-by-core-metric-audit | 1/5/0 | 6 | 7 |
| local-finance | ✅ (bespoke) | improve | ready-after-scope-composition-and-threshold-audit | 1/17/0 | 18 | 13 |
| local-finance-city | **legacy** | improve | **blocked**-until-fiscal-entity-scope-and-latest-year-audit | 1/5/0 | — | — |
| manufacturing | ✅ | improve | ready-after-series-and-definition-audit | 1/5/6 | 6 | 3 |
| occupation-salary | ✅ | improve | **blocked**-by-series-audit | 1/10/28 | 11 | 5 |
| population-dynamics | ✅ | improve | proposal-ready | 1/9/1 | 10 | 10 |
| ports | ✅ | improve | ready-after-table-dimension-scope-and-unit-audit | 3/5/1 | 8 | 3 |
| railway | ✅ | improve | ready-after-geography-coverage-and-series-audit | 2/2/1 | 4 | 2 |
| real-income | ✅ | improve | **blocked**-by-derived-metric-audit | 2/3/6 | 5 | 4 |
| roads | ✅ | improve | ready-after-definition-additivity-and-survey-year-audit | 2/6/2 | 8 | 3 |
| safety | ✅ | **split-candidate** | ready-after-denominator-and-provenance-audit | 3/11/11 | 14 | 6 |
| tourism | ✅ | improve | ready-after-scope-and-series-audit | 1/4/5 | 5 | 4 |

## 所見

### 1. レビューゲートの 3 系統 (次アクションの優先度がここで決まる)

- **proposal-ready (4)**: aging-society / healthcare / living-housing / population-dynamics —
  提案実装可能。theme-designer への設計依頼の先頭候補。
- **ready-after-\*-audit (14)**: 定義・出典・分母・系列の監査を先に通せば実装可能。
- **blocked (4)**: local-economy / occupation-salary / real-income / local-finance-city —
  核心指標・系列・派生計算・財政主体の監査がブロッカー。**カタログ変更より先にデータ品質監査**。

### 2. split-candidate 2 件 (taxonomy referenceの暫定再編案と一致・根拠 2 本)

- **safety**: 治安/交通/火災の主問が同居 → crime-safety / traffic-safety / fire-emergency 分割 +
  parent-hub 化 (根拠: レビュー 07-12 + taxonomy reference §safety)
- **education-culture**: 学校/高等/社会教育の分割 + parent-hub 化 (根拠: レビュー 07-12 + taxonomy reference)
- living-housing はtaxonomy referenceが「条件付き split・全レビュー後まで決めない」としているため improve 止まり。
- **実行前提**: URL・canonical・redirect・関連記事・OGP・sitemap の影響評価 (taxonomy reference §URL・SEO移行原則)
  と、PR-3 以降の実測 baseline 取得。現段階で分割を実行しない。

### 3. legacy 2 件の明示

- **climate**: カタログ未登録 (IndicatorSet のみ)。レビューは観測方法監査後 ready。カタログ化の
  要否は PR-3 の需要実測後に判断 (insufficient-data の段階で廃止判定しない)。
- **local-finance-city**: 同上 + blocked (財政主体スコープ・最新年監査が先)。

### 4. 横断的な品質シグナル (カタログ由来・決定的)

- **selection 未記入が全カタログテーマに残る** (最大: local-finance 18/18・safety 14・fishery-marine 13)。
  提案根拠の provenance が欠けたまま = theme-catalog-standards §4 の warn 対象。
- occupation-salary の context 28 件・aging-society の charts 15 件など、レビューが指摘した
  「主線の希釈」が数値でも確認できる。

## PR-3: 56 日 baseline 集計結果 (2026-07-13 追記)

`aggregate-theme-metrics.ts` で GSC/GA4 を集計し baseline を保存した。
**★集計の落とし穴を実装で回避**: 週次 snapshot は各週 last-28d 窓 (`fetch-{gsc,ga4}-snapshot.mjs`
が endDate-27 で取得) のため、週の単純合算は最大 4 倍の二重計上になる。56d = **非重複 2 窓
(W28 + W24) の合算**で構成した。

### 最重要の実測結果: テーマページは検索集客面ではない

- **GSC: measured 0/22** — 全テーマが 56 日で impressions < 200 (最大 fishery-marine 158・
  全 22 テーマ合算でも 732 imp/56d)。`03_情報設計` が定義する「テーマ = 回遊・深掘り面」の
  ファネル役割が実測で裏付けられた。
- **GA4: measured 2/22** — local-finance (213 pv / 56d)・population-dynamics (206 pv)。
  次点は tourism 97 / fishery-marine 93 (閾値 100 の直下)。
- **含意**: merge/retire 判定の主 KPI を GSC (検索需要) に置くと全テーマが構造的に
  insufficient-data のままになる。**回遊面としての価値 (GA4 内部流入・将来の内部遷移計装) を
  主 KPI とする判定設計が必要** → 閾値・KPI 設計の見直しは PR-4 で根拠つきで行う
  (実測を見た直後に閾値を下げて "measured" を作り出す調整はしない)。

### データ品質の実測 (R2 values.json 全キー走査)

- **gaps 2 テーマ (実欠測 5 キー)**:
  - living-housing: `housing-floor-area` (1/13)
  - manufacturing: `manufacturing-sales-private` / `manufacturing-net-value-added-private` /
    `industrial-land-price` / `industrial-land-price-change-rate` (4/12)
  - → カタログが参照する rankingKey の values.json が R2 に無い = テーマページのチャート欠損の
    可能性。improvement-triage への引き渡し候補 (データ投入 or カタログからの除外判断)。
- latestDataYear: 2023 (fishery-marine / healthcare / occupation-salary / ports / roads /
  local-finance-city) 〜 2025 (local-finance)。stale-data (5 年超) は 0。

## 未計測 (正直な空白・PR-3 後)

| 項目 | 状態 | 埋まる時期 |
|---|---|---|
| GSC テーマ別 56d | 全 22 テーマ insufficient-data (imp<200・実測済みの標本不足) | 閾値/KPI 設計は PR-4 |
| GA4 テーマ別 56d | 20/22 insufficient-data (pv<100) | 同上 |
| 内部遷移 (theme→ranking/blog) | not-instrumented (GA4 未計装) | 計装施策を triage へ提案後 |
| 関連記事数 | null | 後続 |

## PR-4: 継続運用の確定 + 判定設計改訂 (2026-07-13 追記)

### 判定設計の改訂 (measured-low の新設・根拠つき)

PR-3 の「GSC measured 0/22 → merge/retire が構造的に不可能」への是正。**閾値は下げない**。
統計的性質の区別で解決する:

- **カウント統計** (clicks / impressions / pageViews): 56d 窓での低カウントは**それ自体が
  「需要が低い」証拠**になる (量の観測)。→ 新 status `measured-low` = 集計済み標本不足として
  **カウント値のみ保存・解釈可**。
- **比率統計** (CTR / 平均順位 / engagementRate / 滞在): 標本不足ではノイズが支配し解釈不能。
  → measured-low では**保存自体を禁止** (validator P5 が enforce)。
- **P4 改訂**: merge/retire 候補は「GSC/GA4 **両輪**が集計済み (measured | measured-low) かつ
  56d」を要求。insufficient-data (未集計) では引き続き不可 = データ不足と需要不足の区別を維持。

### 確定した継続運用

| 部品 | 内容 |
|---|---|
| `run-theme-portfolio-audit.sh` | 月次推奨/四半期必須の一括監査 (build→aggregate→validate→実験期日→drift git HEAD 比較)。破壊的変更なし |
| `evaluate-theme-experiments.mjs` | 実験の d7/d28/d56 期日到達分に現在実測を記録 (`--check`)、verdict 確定 (`--verdict`・d7 では effect/* 確定不可) |
| CI (pr-quality-check.yml「Theme Portfolio State Guard」) | schema + 判定規律 + fixture テストの検証のみ (読み取り専用) |
| triage 引き渡し形式 | agent 定義 §引き渡し形式 (THEME-<KEY>-NN・根拠/検証/期日/実験 ID 必須) |

E2E スモーク: 監査コマンド通し実行で drift 検出 (insufficient-data → measured-low の遷移 44 件) を
正しく報告することを確認。validator fixture 10/10 green。

## 次アクション

1. gaps 5 キー (living-housing 1 / manufacturing 4) を improvement-triage へ引き渡し
2. proposal-ready 4 テーマの設計依頼を theme-designer へ (blocked 4 は監査を先行)
3. 内部遷移計装 (GA4 カスタムイベント) を improvement-triage へ改善候補として引き渡し
4. 次回定期監査: 2026-08 月次 (`run-theme-portfolio-audit.sh`) / 2026-10 四半期レポート

## 関連

- state: `.claude/state/themes/{portfolio,experiments}.json` (schema: 同 dir README.md)
- 運用設計: `.claude/skills/theme/manage-theme-portfolio/reference/テーマポートフォリオ運用.md`
- 判定基準: `.claude/skills/theme/manage-theme-portfolio/reference/theme-taxonomy-reorganization.md`
- builder: `.claude/scripts/themes/build-theme-portfolio.ts` / validator: `validate-theme-state.mjs`

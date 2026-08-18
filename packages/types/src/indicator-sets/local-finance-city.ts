import type { IndicatorSet } from "../indicator-set";

/**
 * 地方財政 (市区町村版) 指標セット。
 *
 * 都道府県版 (local-finance.ts) と並列の存在として、市区町村 (~1,700 自治体) の
 * 財政指標を提供する。Japan Dashboard の自治体財政ページ
 * (https://www.digital.go.jp/resources/japandashboard/municipal-finance) 互換を意図。
 *
 * 6 指標構成 (#292+ MVP):
 *   - fiscal-strength-index (財政力指数) — D2201
 *   - real-balance-ratio-city (実質収支比率) — D2202
 *   - current-balance-ratio-city (経常収支比率) — D2203
 *   - real-public-debt-service-ratio-city (実質公債費比率) — D2211
 *   - future-burden-ratio-city (将来負担比率) — D2212
 *   - per-taxpayer-taxable-income (1人当たり課税対象所得) — 既存
 *
 * 都道府県版 local-finance.ts の 18 指標のうち、ratio 計算系 (歳出割合等) は
 * 市区町村版では分子・分母から計算が必要なため Phase 2 で追加。
 *
 * .claude/todo/backlog.md
 */
export const LOCAL_FINANCE_CITY_SET: IndicatorSet = {
  key: "local-finance-city",
  title: "地方財政（市区町村）",
  description:
    "市区町村別の財政力指数・経常収支比率・実質公債費比率・将来負担比率などを ~1,700 自治体で比較。Japan Dashboard 自治体財政ページ互換、SSDS（社会・人口統計体系）市区町村データ 廃置分合処理済を採用。",
  category: "economy",
  usage: "theme",
  metrics: [
    { rankingKey: "fiscal-strength-index", shortLabel: "財政力指数", role: "primary" },
    { rankingKey: "current-balance-ratio-city", shortLabel: "経常収支比率", role: "secondary" },
    { rankingKey: "real-public-debt-service-ratio-city", shortLabel: "実質公債費比率", role: "secondary" },
    { rankingKey: "future-burden-ratio-city", shortLabel: "将来負担比率", role: "secondary" },
    { rankingKey: "real-balance-ratio-city", shortLabel: "実質収支比率", role: "secondary" },
    { rankingKey: "per-taxpayer-taxable-income", shortLabel: "課税所得", role: "secondary" },
  ],
};

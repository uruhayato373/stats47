/**
 * パック ↔ テーマの対応と、機械検証用の期待値 (SSOT)。
 * 2026-07-23: 旧 families.ts (A〜L・174 件) を、テーマ別 13 パック (P-01〜P-13) へ縮約。
 */
import type { PackTheme } from "./types";

/** 期待するパック ID の明示リスト (件数導出ではなく明示リスト一致で検証する)。 */
export const EXPECTED_PACK_IDS: readonly string[] = [
  "P-01",
  "P-02",
  "P-03",
  "P-04",
  "P-05",
  "P-06",
  "P-07",
  "P-08",
  "P-09",
  "P-10",
  "P-11",
  "P-12",
  "P-13",
] as const;

/** パック総数。 */
export const EXPECTED_TOTAL: number = EXPECTED_PACK_IDS.length;

/** id → theme (1:1)。 */
export const THEME_BY_ID: Readonly<Record<string, PackTheme>> = {
  "P-01": "population-household",
  "P-02": "income-wage-hiring",
  "P-03": "tourism-lodging",
  "P-04": "municipal-finance",
  "P-05": "healthcare-nursing",
  "P-06": "education-childcare",
  "P-07": "migration-living",
  "P-08": "retail-trade-area",
  "P-09": "industry-economy",
  "P-10": "disaster-infrastructure",
  "P-11": "map-chart-assets",
  "P-12": "all-in-one",
  "P-13": "free-trial",
} as const;

/** テーマの表示メタ。 */
export const PACK_META: Readonly<
  Record<PackTheme, { readonly id: string; readonly label: string }>
> = {
  "population-household": { id: "P-01", label: "人口・世帯" },
  "income-wage-hiring": { id: "P-02", label: "所得・賃金・採用" },
  "tourism-lodging": { id: "P-03", label: "観光・宿泊" },
  "municipal-finance": { id: "P-04", label: "自治体財政" },
  "healthcare-nursing": { id: "P-05", label: "医療・介護" },
  "education-childcare": { id: "P-06", label: "教育・子育て" },
  "migration-living": { id: "P-07", label: "移住・生活" },
  "retail-trade-area": { id: "P-08", label: "出店・商圏" },
  "industry-economy": { id: "P-09", label: "産業・経済" },
  "disaster-infrastructure": { id: "P-10", label: "防災・インフラ" },
  "map-chart-assets": { id: "P-11", label: "汎用地図・チャート素材集" },
  "all-in-one": { id: "P-12", label: "全部入りバンドル" },
  "free-trial": { id: "P-13", label: "無料お試し" },
} as const;

/** 全テーマ slug 集合 (validator の enum 二重チェック用)。 */
export const PACK_THEMES: ReadonlySet<PackTheme> = new Set(
  Object.keys(PACK_META) as PackTheme[],
);

/**
 * 価格 0 を許容するテーマ。
 * free-trial (P-13)=無料お試し。他パックはすべて有償。
 */
export const ZERO_PRICE_THEMES: ReadonlySet<PackTheme> = new Set<PackTheme>(["free-trial"]);

/**
 * パック ↔ テーマの対応と、機械検証用の期待値 (SSOT)。
 * 2026-07-23: 旧 families.ts (A〜L・174 件) を、テーマ別 14 パック (P-01〜P-14) へ縮約。
 */
import type { PackTheme } from "./types";
import data from "../../../../data/products/packs/packs.json";

/**
 * 期待するパック ID の一覧。台帳 `products.packs` (data/products/packs/packs.json) のキーから導く。
 * 件数 (14) と P-01〜P-14 の並びは tests/catalog.test.ts が固定する。
 */
export const EXPECTED_PACK_IDS: readonly string[] = Object.keys(data.packs);

/** パック総数。 */
export const EXPECTED_TOTAL: number = EXPECTED_PACK_IDS.length;

/** id → theme (1:1)。台帳 `products.packs` の theme から導く。 */
export const THEME_BY_ID: Readonly<Record<string, PackTheme>> = Object.fromEntries(
  Object.entries(data.packs).map(([id, pack]) => [id, pack.theme as PackTheme]),
);

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
  "household-consumption": { id: "P-14", label: "家計・消費" },
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

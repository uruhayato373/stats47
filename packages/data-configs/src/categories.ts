/**
 * カテゴリマスタ (git TS = SSOT)
 *
 * 完全DBレス (docs/01_技術設計/19_完全DBレス設計.md) §3: 運用エンティティの設定は
 * git TS を SSOT にする。categories は従来 D1 `categories` テーブルにあったが、本ファイルを
 * 単一ソースにする。確定値は 2026-05-29 時点の配信中 (`apps/web/public/search-index-meta.json`
 * の categories[] および D1 categories テーブルと完全一致、17 件・displayOrder 順) を固定したもの。
 *
 * displayOrder は配列順 (= 配信中の表示順)。アイコン SVG は別途 R2 `app/categories/svg/<key>.svg`。
 */

export interface CategoryMeta {
  categoryKey: string;
  categoryName: string;
  /** lucide-react アイコン名 (UI / categories snapshot 用)。 */
  icon: string;
  /** 表示順 (配列の index と一致)。 */
  displayOrder: number;
}

/** [categoryKey, categoryName, lucide icon] — 配列順 = displayOrder (配信中と一致)。 */
const CATEGORY_DEFS: ReadonlyArray<readonly [string, string, string]> = [
  ["landweather", "国土・気象", "MapPin"],
  ["population", "人口・世帯", "Users"],
  ["laborwage", "労働・賃金", "TrendingUp"],
  ["agriculture", "農林水産業", "Sprout"],
  ["miningindustry", "鉱工業", "Factory"],
  ["commercial", "商業・サービス業", "Store"],
  ["economy", "企業・家計・経済", "PieChart"],
  ["construction", "住宅・土地・建設", "Home"],
  ["energy", "エネルギー・水", "Droplets"],
  ["tourism", "運輸・観光", "Plane"],
  ["educationsports", "教育・文化・スポーツ", "GraduationCap"],
  ["administrativefinancial", "行財政", "Building2"],
  ["safetyenvironment", "司法・安全・環境", "ShieldCheck"],
  ["socialsecurity", "社会保障・衛生", "Hospital"],
  ["international", "国際", "Globe"],
  ["infrastructure", "社会基盤施設", "Construction"],
  ["ict", "情報通信・科学技術", "Wifi"],
];

export const CATEGORIES: readonly CategoryMeta[] = CATEGORY_DEFS.map(
  ([categoryKey, categoryName, icon], displayOrder) => ({
    categoryKey,
    categoryName,
    icon,
    displayOrder,
  }),
);

const BY_KEY: ReadonlyMap<string, CategoryMeta> = new Map(
  CATEGORIES.map((c) => [c.categoryKey, c]),
);

/** categoryKey から表示名を引く。未知キーは null。 */
export function getCategoryName(categoryKey: string): string | null {
  return BY_KEY.get(categoryKey)?.categoryName ?? null;
}

/** displayOrder 順の全カテゴリ。 */
export function listCategories(): readonly CategoryMeta[] {
  return CATEGORIES;
}

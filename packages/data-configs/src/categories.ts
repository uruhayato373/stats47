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
  /** 表示順 (配列の index と一致)。 */
  displayOrder: number;
}

const CATEGORY_NAMES: ReadonlyArray<readonly [string, string]> = [
  ["landweather", "国土・気象"],
  ["population", "人口・世帯"],
  ["laborwage", "労働・賃金"],
  ["agriculture", "農林水産業"],
  ["miningindustry", "鉱工業"],
  ["commercial", "商業・サービス業"],
  ["economy", "企業・家計・経済"],
  ["construction", "住宅・土地・建設"],
  ["energy", "エネルギー・水"],
  ["tourism", "運輸・観光"],
  ["educationsports", "教育・文化・スポーツ"],
  ["administrativefinancial", "行財政"],
  ["safetyenvironment", "司法・安全・環境"],
  ["socialsecurity", "社会保障・衛生"],
  ["international", "国際"],
  ["infrastructure", "社会基盤施設"],
  ["ict", "情報通信・科学技術"],
];

export const CATEGORIES: readonly CategoryMeta[] = CATEGORY_NAMES.map(
  ([categoryKey, categoryName], displayOrder) => ({
    categoryKey,
    categoryName,
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

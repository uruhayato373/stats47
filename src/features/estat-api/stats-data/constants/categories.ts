/**
 * e-Stat API分類パラメータ定義
 */

export type CategoryDefinition = {
  id: string;
  label: string;
};

/**
 * 利用可能な分類カテゴリー一覧
 * e-Stat APIの地域、時間軸および分類02～15に対応
 */
export const AVAILABLE_CATEGORIES: readonly CategoryDefinition[] = [
  { id: "cdArea", label: "地域" },
  { id: "cdTime", label: "時間軸" },
  { id: "cdCat02", label: "分類02" },
  { id: "cdCat03", label: "分類03" },
  { id: "cdCat04", label: "分類04" },
  { id: "cdCat05", label: "分類05" },
  { id: "cdCat06", label: "分類06" },
  { id: "cdCat07", label: "分類07" },
  { id: "cdCat08", label: "分類08" },
  { id: "cdCat09", label: "分類09" },
  { id: "cdCat10", label: "分類10" },
  { id: "cdCat11", label: "分類11" },
  { id: "cdCat12", label: "分類12" },
  { id: "cdCat13", label: "分類13" },
  { id: "cdCat14", label: "分類14" },
  { id: "cdCat15", label: "分類15" },
] as const;

/**
 * 動的フィールドの配列（URL復元用）
 */
export const DYNAMIC_FIELD_IDS = AVAILABLE_CATEGORIES.map((cat) => cat.id);

/** 比較対象地域 */
export interface ComparisonRegion {
  areaCode: string;      // "01000", "13000" など（5桁 prefCode 形式）
  areaName: string;      // "東京都", "大阪府"
  color: string;         // グラフ表示色
}

/** 地域A の固定色（青） */
export const REGION_A_COLOR = "#3B82F6"; // blue-500

/** 地域B の固定色（赤） */
export const REGION_B_COLOR = "#EF4444"; // red-500

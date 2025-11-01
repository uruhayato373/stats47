/**
 * 統計データの基本型
 */
export interface StatsSchema {
  areaCode: string;
  areaName: string;
  timeCode: string;
  timeName: string;
  categoryCode: string;
  categoryName: string;
  value: number;
  unit: string;
}

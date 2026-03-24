import type { AreaProfileIndicator } from "../shared/types/area-profile";

export interface AreaProfilePreviewData {
  areaName: string;
  strengths: AreaProfileIndicator[];
  weaknesses: AreaProfileIndicator[];
}

export const previewDataAreaProfile: AreaProfilePreviewData = {
  areaName: "東京都",
  strengths: [
    { label: "昼間人口比率", rank: 1, value: 117.8, unit: "%" },
    { label: "大学進学率", rank: 1, value: 67.1, unit: "%" },
    { label: "平均年収", rank: 1, value: 622, unit: "万円" },
    { label: "事業所数", rank: 1, value: 620438, unit: "所" },
    { label: "人口密度", rank: 1, value: 6402, unit: "人/km²" },
  ],
  weaknesses: [
    { label: "住宅地価", rank: 47, value: 38.7, unit: "万円/m²" },
    { label: "通勤時間", rank: 47, value: 53.0, unit: "分" },
    { label: "一人当たり公園面積", rank: 47, value: 2.9, unit: "m²" },
    { label: "持ち家比率", rank: 47, value: 45.0, unit: "%" },
    { label: "一戸建て率", rank: 47, value: 28.7, unit: "%" },
  ],
};

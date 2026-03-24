import type { ComparisonIndicator } from "../shared/types/comparison";

export interface ComparisonPreviewData {
  areaNameA: string;
  areaNameB: string;
  areaCodeA: string;
  areaCodeB: string;
  hookText: string;
  indicators: ComparisonIndicator[];
}

export const previewDataComparison: ComparisonPreviewData = {
  areaNameA: "大阪府",
  areaNameB: "愛知県",
  areaCodeA: "27000",
  areaCodeB: "23000",
  hookText: "経済力どっちが上？",
  indicators: [
    { label: "県内総生産額", unit: "百万円", valueA: 41320372, valueB: 40585984, rankA: 2, rankB: 3 },
    { label: "1人当たり県民所得", unit: "千円", valueA: 3013, valueB: 3527, rankA: 13, rankB: 2 },
    { label: "製造品出荷額等（1事業所あたり）", unit: "百万円", valueA: 1039.7, valueB: 3134.8, rankA: 37, rankB: 4 },
    { label: "商業年間商品販売額（1事業所あたり）", unit: "百万円", valueA: 902.0, valueB: 781.2, rankA: 2, rankB: 3 },
    { label: "財政力指数", unit: "‐", valueA: 0.74187, valueB: 0.86737, rankA: 5, rankB: 2 },
    { label: "有効求人倍率", unit: "倍", valueA: 1.22, valueB: 1.42, rankA: 34, rankB: 25 },
    { label: "完全失業率", unit: "％", valueA: 4.5, valueB: 3.3, rankA: 4, rankB: 41 },
  ],
};

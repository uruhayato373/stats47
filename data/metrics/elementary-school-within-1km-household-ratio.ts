import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const elementarySchoolWithin1kmHouseholdRatio: MetricConfig = {
  "key": "elementary-school-within-1km-household-ratio",
  "title": "小学校まで1km未満の世帯の割合",
  "description": "主世帯のうち、住宅から最寄りの小学校までの距離が1km未満の世帯の割合。住宅・土地統計調査の「世帯の型、最寄りの小学校までの距離別主世帯数」から、1,000m未満の距離帯の合計を総数で割って求めた。",
  "note": "住宅・土地統計調査は標本調査で、市区と人口1万5千人以上の町村だけを集計する。推計値の丸めで割合が100%をわずかに超える自治体は順位から除く。",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0004025630",
    "cdTab": "13-2023",
    "cdCat01": "00",
    "axisRatio": {
      "axis": "cat02",
      "numeratorCodes": ["1", "2", "3", "4"],
      "denominatorCodes": ["0"],
    },
    "displayName": "住宅・土地統計調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004025630",
  },
  "citySource": {
    "kind": "estat",
    "statsDataId": "0004025630",
    "cdTab": "13-2023",
    "cdCat01": "00",
    "axisRatio": {
      "axis": "cat02",
      "numeratorCodes": ["1", "2", "3", "4"],
      "denominatorCodes": ["0"],
    },
    "displayName": "住宅・土地統計調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004025630",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};

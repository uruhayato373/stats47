import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const nurseryWithin500mYoungChildHouseholdRatio: MetricConfig = {
  "key": "nursery-within-500m-young-child-household-ratio",
  "title": "保育所まで500m未満の子育て世帯の割合",
  "description": "6歳未満の子のいる主世帯のうち、住宅から最寄りの保育所までの距離が500m未満の世帯の割合。住宅・土地統計調査の「世帯の型、最寄りの保育所までの距離別主世帯数」から、100m未満・100～200m未満・200～500m未満の合計を総数で割って求めた。",
  "note": "住宅・土地統計調査は標本調査で、市区と人口1万5千人以上の町村だけを集計する。推計値の丸めで割合が100%をわずかに超える自治体は順位から除く。",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0004025628",
    "cdTab": "13-2023",
    "cdCat01": "R1",
    "axisRatio": {
      "axis": "cat02",
      "numeratorCodes": ["1", "2", "3"],
      "denominatorCodes": ["0"],
    },
    "displayName": "住宅・土地統計調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004025628",
  },
  "citySource": {
    "kind": "estat",
    "statsDataId": "0004025628",
    "cdTab": "13-2023",
    "cdCat01": "R1",
    "axisRatio": {
      "axis": "cat02",
      "numeratorCodes": ["1", "2", "3"],
      "denominatorCodes": ["0"],
    },
    "displayName": "住宅・土地統計調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004025628",
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

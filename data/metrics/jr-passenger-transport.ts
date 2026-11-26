import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const jrPassengerTransport: MetricConfig = {
  "key": "jr-passenger-transport",
  "title": "ＪＲ輸送人員",
  "description": "旅客地域流動調査で、年度中にJR鉄道が輸送した全旅客を都道府県別に推計した人数。",
  "note": "民鉄、地下鉄、路面電車などJR以外の鉄道・軌道は含まない。値が0でも、その都道府県で鉄道旅客輸送が全くないことを意味しない。",
  "unit": "千人",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3704",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2005,
    "to": 2023,
  },
  "yearFormat": "fiscal",
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
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "千人/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "千人/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};

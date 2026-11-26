import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const householdsOnPublicAssistance: MetricConfig = {
  "key": "households-on-public-assistance",
  "title": "生活保護被保護実世帯数",
  "subtitle": "総数",
  "unit": "世帯",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010110",
    "cdCat01": "J1101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "世帯/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "世帯/100km²",
        "decimalPlaces": 2,
      },
      {
        "type": "series",
        "metric": "households-on-public-assistance-per-1000",
        "label": "1000世帯当たり",
      },
    ],
  },
  "groupKey": "households-on-public-assistance",
  "isActive": true,
};

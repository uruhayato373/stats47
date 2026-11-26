import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const airPassengerTransport: MetricConfig = {
  "key": "air-passenger-transport",
  "title": "航空輸送人員",
  "unit": "千人",
  "category": "tourism",
  "description": "旅客地域流動調査で集計された、定期国内航空便による年間の旅客輸送人員。",
  "note": "国内旅客だけを対象とし、大阪国際空港の輸送人員は大阪府に帰属させている。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3706",
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

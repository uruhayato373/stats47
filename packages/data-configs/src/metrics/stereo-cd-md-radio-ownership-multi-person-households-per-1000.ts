import type { MetricConfig } from "../types";

export const stereoCdMdRadioOwnershipMultiPersonHouseholdsPer1000: MetricConfig = {
  "key": "stereo-cd-md-radio-ownership-multi-person-households-per-1000",
  "title": "ステレオ・CDラジカセ所有数量",
  "unit": "台",
  "category": "ict",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L03609",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2009,
    "to": 2009,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "ステレオセットまたはＣＤ・ＭＤラジオカセット所有数量",
  "isActive": false,
};

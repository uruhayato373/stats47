import type { MetricConfig } from "../types";

export const ratioOfTotalPopulation: MetricConfig = {
  "key": "ratio-of-total-population",
  "title": "全国総人口に占める割合",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A01101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "全国総人口に占める人口割合（A1101/A1101(全国)）",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};

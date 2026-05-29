import type { MetricConfig } from "../types";

export const agriculturalOutputPerEmployedPerson: MetricConfig = {
  "key": "agricultural-output-per-employed-person",
  "title": "就業者1人当たり農業産出額",
  "unit": "万円",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C0410101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2018,
    "to": 2018,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "就業者1人当たり農業産出額（販売農家）",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};

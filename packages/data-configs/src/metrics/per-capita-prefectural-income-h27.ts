import type { MetricConfig } from "../types";

export const perCapitaPrefecturalIncomeH27: MetricConfig = {
  "key": "per-capita-prefectural-income-h27",
  "title": "1人当たり県民所得",
  "subtitle": "H27年基準",
  "unit": "千円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C01321",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
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
  "seoTitle": "1人当たり県民所得（平成27年基準）",
  "isActive": true,
};

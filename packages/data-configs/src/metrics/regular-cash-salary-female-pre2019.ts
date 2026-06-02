import type { MetricConfig } from "../types";

export const regularCashSalaryFemalePre2019: MetricConfig = {
  "key": "regular-cash-salary-female-pre2019",
  "title": "きまって支給する現金給与月額",
  "subtitle": "女性（〜2018年）",
  "unit": "千円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F0620102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2019,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
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
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};

import type { MetricConfig } from "../types";

export const wagesSalariesH27: MetricConfig = {
  "key": "wages-salaries-h27",
  "title": "賃金・俸給",
  "unit": "百万円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C122201",
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
  "seoTitle": "賃金・俸給（平成27年基準）",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};

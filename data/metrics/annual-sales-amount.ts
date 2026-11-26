import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const annualSalesAmount: MetricConfig = {
  "key": "annual-sales-amount",
  "title": "商業年間商品販売額",
  "subtitle": "総額",
  "unit": "百万円",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3501",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      1975,
      1978,
      1981,
      1984,
      1987,
      1990,
      1993,
      1996,
      1998,
      2001,
      2003,
      2006,
      2011,
      2013,
      2015,
      2018,
      2019,
      2020,
      2021,
      2022,
      2023,
    ],
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "百万円/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "百万円/100km²",
        "decimalPlaces": 2,
      },
      {
        "type": "series",
        "metric": "annual-sales-amount-per-employee",
        "label": "従業員当たり",
      },
      {
        "type": "series",
        "metric": "annual-sales-amount-per-establishment",
        "label": "事業所当たり",
      },
    ],
  },
  "groupKey": "annual-sales-amount",
  "isActive": true,
};

import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const employeeRatio1029EmployeeEstablishmentsPrivate: MetricConfig = {
  "key": "employee-ratio-10-29-employee-establishments-private",
  "title": "10〜29人事業所の従業者割合",
  "unit": "％",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C03208",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2009,
      2011,
      2014,
      2016,
      2021,
    ],
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
  },
  "seoTitle": "10〜29人事業所の従業者割合ランキング都道府県【2021年】｜1位青森県（29.87％）",
  "seoDescription": "2021年の10〜29人事業所の従業者割合の都道府県別ランキング。1位青森県（29.87％）、最下位東京都（18.99％）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

import type { MetricConfig } from "../types";

export const employeeRatio100299EmployeeEstablishmentsPrivate: MetricConfig = {
  "key": "employee-ratio-100-299-employee-establishments-private",
  "title": "100〜299人事業所の従業者割合",
  "unit": "％",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C03209",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2011,
      2014,
      2016,
      2021,
    ],
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
  "seoTitle": "100〜299人事業所の従業者割合ランキング都道府県【2021年】｜1位東京都（16.09％）",
  "seoDescription": "2021年の100〜299人事業所の従業者割合の都道府県別ランキング。1位東京都（16.09％）、最下位島根県（11.03％）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

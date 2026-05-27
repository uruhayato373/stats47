import type { MetricConfig } from "../types";

export const employeeRatio59EmployeeEstablishmentsPrivate: MetricConfig = {
  "key": "employee-ratio-5-9-employee-establishments-private",
  "title": "5〜9人事業所の従業者割合",
  "unit": "％",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C03207",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2021,
    "to": 2021,
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
  "seoTitle": "5〜9人事業所の従業者割合ランキング都道府県【2021年】｜1位高知県（14.94％）",
  "seoDescription": "2021年の5〜9人事業所の従業者割合の都道府県別ランキング。1位高知県（14.94％）、最下位東京都（8.47％）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

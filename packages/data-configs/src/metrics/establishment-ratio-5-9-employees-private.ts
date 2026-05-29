import type { MetricConfig } from "../types";

export const establishmentRatio59EmployeesPrivate: MetricConfig = {
  "key": "establishment-ratio-5-9-employees-private",
  "title": "従業者5～9人の事業所割合",
  "unit": "％",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C02207",
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
  "seoTitle": "従業者5～9人の事業所割合ランキング都道府県【2021年】｜1位福岡県（20.69％）",
  "seoDescription": "2021年の従業者5～9人の事業所割合の都道府県別ランキング。1位福岡県（20.69％）、最下位和歌山県（17.74％）で1.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

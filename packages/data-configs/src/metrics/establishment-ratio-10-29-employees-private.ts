import type { MetricConfig } from "../types";

export const establishmentRatio1029EmployeesPrivate: MetricConfig = {
  "key": "establishment-ratio-10-29-employees-private",
  "title": "従業者10～29人の事業所割合",
  "unit": "％",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C02208",
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
  "seoTitle": "従業者10～29人の事業所割合ランキング都道府県【2021年】｜1位千葉県（18.97％）",
  "seoDescription": "2021年の従業者10～29人の事業所割合の都道府県別ランキング。1位千葉県（18.97％）、最下位和歌山県（13.99％）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

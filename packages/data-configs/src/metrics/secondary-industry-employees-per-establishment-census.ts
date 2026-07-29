import type { MetricConfig } from "../types";

export const secondaryIndustryEmployeesPerEstablishmentCensus: MetricConfig = {
  "key": "secondary-industry-employees-per-establishment-census",
  "title": "第2次産業従業者数",
  "subtitle": "経済センサス",
  "unit": "人",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C03303",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1975,
      1978,
      1981,
      1986,
      1991,
      1996,
      2001,
      2006,
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "第2次産業従業者数ランキング都道府県【2006年】｜1位愛知県（16人）",
  "seoDescription": "2006年の第2次産業従業者数の都道府県別ランキング。1位愛知県（16人）、最下位高知県（9.11人）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

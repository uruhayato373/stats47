import type { MetricConfig } from "../types";

export const annualSalesAmountPerEmployee: MetricConfig = {
  "key": "annual-sales-amount-per-employee",
  "title": "商業年間商品販売額",
  "subtitle": "従業員当たり",
  "unit": "万円",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C04505",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
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
      2020,
      2022,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "annual-sales-amount",
  "seoTitle": "商業年間商品販売額ランキング都道府県【2022年】｜1位東京都（13,442.7万円）",
  "seoDescription": "2022年の商業年間商品販売額の都道府県別ランキング。1位東京都（13,442.7万円）、最下位奈良県（2,540.3万円）で5.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

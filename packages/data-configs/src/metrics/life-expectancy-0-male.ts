import type { MetricConfig } from "../types";

export const lifeExpectancy0Male: MetricConfig = {
  "key": "life-expectancy-0-male",
  "title": "平均余命",
  "subtitle": "男性 0歳時点（平均寿命）",
  "unit": "年",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I0520101",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1975,
      1980,
      1985,
      1990,
      1995,
      2000,
      2005,
      2010,
      2015,
      2020,
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
        "unit": "年/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "年/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "年/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "平均余命ランキング都道府県【2020年】｜1位滋賀県（82.73年）",
  "seoDescription": "2020年の平均余命の都道府県別ランキング。1位滋賀県（82.73年）、最下位青森県（79.27年）で1.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

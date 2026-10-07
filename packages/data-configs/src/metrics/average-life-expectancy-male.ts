import type { MetricConfig } from "../types";

export const averageLifeExpectancyMale: MetricConfig = {
  "key": "average-life-expectancy-male",
  "title": "平均余命",
  "subtitle": "男性 20歳時点",
  "unit": "年",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I0520201",
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
  "yearFormat": "calendar",
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
    ],
  },
  "seoTitle": "平均余命 都道府県ランキング【2020年】｜1位長野県（63.07年）",
  "seoDescription": "2020年の平均余命を都道府県別に比較。1位は長野県（63.07年）、最下位は青森県（59.66年）、最大と最小の差は1.1倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};

import type { MetricConfig } from "../types";

export const averageAgeOfFirstMarriageWife: MetricConfig = {
  "key": "average-age-of-first-marriage-wife",
  "title": "平均初婚年齢（妻）",
  "subtitle": "妻の年齢",
  "unit": "歳",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A9112",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
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
        "unit": "歳/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "歳/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "平均婚姻年齢ランキング都道府県【2023年】｜1位東京都（30.7歳）",
  "seoDescription": "2023年の平均婚姻年齢の都道府県別ランキング。1位東京都（30.7歳）、最下位島根県（28.9歳）で1.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

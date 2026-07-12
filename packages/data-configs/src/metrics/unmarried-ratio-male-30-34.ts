import type { MetricConfig } from "../types";

export const unmarriedRatioMale3034: MetricConfig = {
  "key": "unmarried-ratio-male-30-34",
  "thumbnailVariant": "number",
  "title": "未婚者割合",
  "subtitle": "男性 30〜34歳",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A0410501",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
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
  },
  "seoTitle": "未婚者割合ランキング都道府県【2020年】｜1位秋田県（51.8％）",
  "seoDescription": "2020年の未婚者割合の都道府県別ランキング。1位秋田県（51.8％）、最下位大阪府（39.3％）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

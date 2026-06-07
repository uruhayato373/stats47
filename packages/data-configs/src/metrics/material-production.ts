import type { MetricConfig } from "../types";

export const materialProduction: MetricConfig = {
  "key": "material-production",
  "title": "素材生産量",
  "unit": "千ｍ3",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3110",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1993,
    "to": 2007,
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "千ｍ3/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "千ｍ3/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "素材生産量ランキング都道府県【2007年】｜1位北海道（3,511千ｍ3）",
  "seoDescription": "2007年の素材生産量の都道府県別ランキング。1位北海道（3,511千ｍ3）、最下位香川県（3千ｍ3）で1170.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

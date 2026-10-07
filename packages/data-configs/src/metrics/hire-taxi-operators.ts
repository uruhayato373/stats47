import type { MetricConfig } from "../types";

export const hireTaxiOperators: MetricConfig = {
  "key": "hire-taxi-operators",
  "title": "ハイヤー・タクシー事業者",
  "unit": "社",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3710",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2013,
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
        "unit": "社/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "社/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "ハイヤー・タクシー事業者ランキング都道府県【2013年】｜1位東京都（16,256社）",
  "seoDescription": "2013年のハイヤー・タクシー事業者の都道府県別ランキング。1位東京都（16,256社）、最下位鳥取県（61社）で266.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

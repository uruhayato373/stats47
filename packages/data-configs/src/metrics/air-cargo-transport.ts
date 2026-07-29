import type { MetricConfig } from "../types";

export const airCargoTransport: MetricConfig = {
  "key": "air-cargo-transport",
  "title": "航空貨物輸送量",
  "unit": "ｋｇ",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C370601",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
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
    "minValueType": "data-min",
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
        "unit": "ｋｇ/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "ｋｇ/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "航空貨物輸送量ランキング都道府県【2023年】｜1位東京都（227,236,915ｋｇ）",
  "seoDescription": "2023年の航空貨物輸送量の都道府県別ランキング。1位東京都（227,236,915ｋｇ）、最下位奈良県（0ｋｇ）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};

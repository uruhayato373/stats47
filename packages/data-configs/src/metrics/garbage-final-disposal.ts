import type { MetricConfig } from "../types";

export const garbageFinalDisposal: MetricConfig = {
  "key": "garbage-final-disposal",
  "title": "ごみ最終処分量",
  "unit": "t",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H5615",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2022,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 0,
    "displayUnit": "万t",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "t/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "t/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "ごみ最終処分量ランキング都道府県【2023年】｜1位大阪府（319,002t）",
  "seoDescription": "2023年のごみ最終処分量の都道府県別ランキング。1位大阪府（319,002t）、最下位高知県（8,442t）で37.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

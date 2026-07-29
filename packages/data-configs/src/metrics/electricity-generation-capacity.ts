import type { MetricConfig } from "../types";

export const electricityGenerationCapacity: MetricConfig = {
  "key": "electricity-generation-capacity",
  "title": "発電電力量",
  "unit": "Ｍｗｈ",
  "category": "energy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H05106",
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
    "colorScheme": "interpolateOranges",
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
        "unit": "Ｍｗｈ/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "Ｍｗｈ/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "発電電力量ランキング都道府県【2023年】｜1位千葉県（80,635,294Ｍｗｈ）",
  "seoDescription": "2023年の発電電力量の都道府県別ランキング。1位千葉県（80,635,294Ｍｗｈ）、最下位埼玉県（537,679Ｍｗｈ）で150.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

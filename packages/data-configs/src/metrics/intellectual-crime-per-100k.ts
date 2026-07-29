import type { MetricConfig } from "../types";

export const intellectualCrimePer100k: MetricConfig = {
  "key": "intellectual-crime-per-100k",
  "title": "知能犯認知件数",
  "description": "詐欺・横領・偽造・汚職・背任の認知件数。人口10万人当たり。",
  "unit": "件",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010111",
    "cdCat01": "K420104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2005,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
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
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "知能犯認知件数ランキング都道府県【2023年】｜1位東京都（7,336件）",
  "seoDescription": "2023年の知能犯認知件数の都道府県別ランキング。1位東京都（7,336件）、最下位福井県（130件）で56.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

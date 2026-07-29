import type { MetricConfig } from "../types";

export const fireRelatedPersonnelCountPer100k: MetricConfig = {
  "key": "fire-related-personnel-count-per-100k",
  "title": "消防関係人員数",
  "unit": "人",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K01301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1985,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
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
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "消防関係人員数ランキング都道府県【2022年】｜1位佐賀県（2,335人）",
  "seoDescription": "2022年の消防関係人員数の都道府県別ランキング。1位佐賀県（2,335人）、最下位沖縄県（227.9人）で10.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

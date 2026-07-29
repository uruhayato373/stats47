import type { MetricConfig } from "../types";

export const keiCarCount: MetricConfig = {
  "key": "kei-car-count",
  "title": "軽自動車等台数",
  "unit": "台",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H7207",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2010,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
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
        "unit": "台/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "台/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "軽自動車等台数ランキング都道府県【2024年】｜1位愛知県（2,201,199台）",
  "seoDescription": "2024年の軽自動車等台数の都道府県別ランキング。1位愛知県（2,201,199台）、最下位鳥取県（281,590台）で7.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

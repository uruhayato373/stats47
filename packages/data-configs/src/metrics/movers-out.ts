import type { MetricConfig } from "../types";

export const moversOut: MetricConfig = {
  "key": "movers-out",
  "title": "転出者数",
  "subtitle": "外国人移動者",
  "description": "都道府県から転出した外国人移動者の年間人数。地域間移動の流出側を実数で示す。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A5104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2018,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
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
  "seoTitle": "転出者数ランキング都道府県【2024年】｜1位東京都（382,169人）",
  "seoDescription": "2024年の転出者数の都道府県別ランキング。1位東京都（382,169人）、最下位鳥取県（9,825人）で38.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

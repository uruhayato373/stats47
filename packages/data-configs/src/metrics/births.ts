import type { MetricConfig } from "../types";

export const births: MetricConfig = {
  "key": "births",
  "title": "出生数",
  "description": "人口動態統計で把握した、1年間に出生した子の数です。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A4101",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1995,
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
  "seoTitle": "出生数ランキング都道府県【2023年】｜1位東京都（86,348人）",
  "seoDescription": "2023年の出生数の都道府県別ランキング。1位東京都（86,348人）、最下位鳥取県（3,263人）で26.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

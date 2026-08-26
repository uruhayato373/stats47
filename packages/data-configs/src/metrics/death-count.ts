import type { MetricConfig } from "../types";

export const deathCount: MetricConfig = {
  "key": "death-count",
  "title": "死亡数",
  "description": "人口動態統計で把握した、1年間に死亡した人の数です。",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A4200",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1980,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
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
  "seoTitle": "死亡数ランキング都道府県【2023年】｜1位東京都（137,241人）",
  "seoDescription": "2023年の死亡数の都道府県別ランキング。1位東京都（137,241人）、最下位鳥取県（8,290人）で16.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

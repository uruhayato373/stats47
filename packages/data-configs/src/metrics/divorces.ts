import type { MetricConfig } from "../types";

export const divorces: MetricConfig = {
  "key": "divorces",
  "title": "離婚件数",
  "description": "人口動態統計で把握された年間の離婚件数。都道府県ごとの婚姻動態を実数で示す。",
  "unit": "組",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A9201",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1975,
    "to": 2023,
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
        "unit": "組/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "組/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "離婚件数ランキング都道府県【2023年】｜1位東京都（20,016組）",
  "seoDescription": "2023年の離婚件数の都道府県別ランキング。1位東京都（20,016組）、最下位鳥取県（781組）で25.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

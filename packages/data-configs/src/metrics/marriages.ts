import type { MetricConfig } from "../types";

export const marriages: MetricConfig = {
  "key": "marriages",
  "title": "婚姻件数",
  "description": "人口動態調査で、各年1月1日から12月31日までに日本国内の市区町村長へ届け出られた婚姻の件数。",
  "note": "暦年の届出件数であり、婚姻している人の総数や婚姻率ではない。",
  "unit": "組",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A9101",
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
  "seoTitle": "婚姻件数ランキング都道府県【2023年】｜1位東京都（71,774組）",
  "seoDescription": "2023年の婚姻件数の都道府県別ランキング。1位東京都（71,774組）、最下位鳥取県（1,810組）で39.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

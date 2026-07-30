import type { MetricConfig } from "../types";

export const dogRegistrationCount: MetricConfig = {
  "key": "dog-registration-count",
  "title": "犬の登録頭数",
  "unit": "頭",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026908",
    "cdTab": "1580",
    "displayName": "衛生行政報告例",
    "url": "https://www.mhlw.go.jp/toukei/list/36-19.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
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
        "unit": "頭/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "頭/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "animal-registration",
  "seoTitle": "犬の登録頭数ランキング都道府県【2020年】｜1位東京都（510,511頭）",
  "seoDescription": "2020年の犬の登録頭数の都道府県別ランキング。1位東京都（510,511頭）、最下位鳥取県（21,627頭）で23.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

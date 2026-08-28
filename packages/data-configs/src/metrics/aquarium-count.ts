import type { MetricConfig } from "../types";

export const aquariumCount: MetricConfig = {
  "key": "aquarium-count",
  "title": "登録・相当水族館数",
  "subtitle": "登録博物館と博物館相当施設の合計（博物館類似施設を除く）",
  "unit": "館",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003348770",
    "cdCat01": "00001000",
    "cdCat02": "182",
    "displayName": "社会教育調査",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2015,
    "to": 2015,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
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
        "unit": "館/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "館/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "museum-type-count",
  "seoTitle": "登録・相当水族館数ランキング【2015年】｜1位北海道（3館）",
  "seoDescription": "2015年の登録博物館・博物館相当施設に該当する水族館数を都道府県別に比較。博物館類似施設は含みません。",
  "isActive": true,
};

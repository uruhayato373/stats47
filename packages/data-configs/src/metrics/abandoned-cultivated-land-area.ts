import type { MetricConfig } from "../types";

export const abandonedCultivatedLandArea: MetricConfig = {
  "key": "abandoned-cultivated-land-area",
  "title": "耕地放棄面積",
  "unit": "ｈａ",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3109",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2014,
    "to": 2014,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateGreens",
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
        "unit": "ｈａ/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "ｈａ/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "耕地放棄面積ランキング都道府県【2014年】｜1位福島県（25,226ｈａ）",
  "seoDescription": "2014年の耕地放棄面積の都道府県別ランキング。1位福島県（25,226ｈａ）、最下位東京都（956ｈａ）で26.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

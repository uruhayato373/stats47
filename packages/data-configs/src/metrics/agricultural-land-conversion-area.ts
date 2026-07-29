import type { MetricConfig } from "../types";

export const agriculturalLandConversionArea: MetricConfig = {
  "key": "agricultural-land-conversion-area",
  "title": "農地の転用面積",
  "unit": "ｈａ",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3108",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
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
  "seoTitle": "農地の転用面積ランキング都道府県【2022年】｜1位茨城県（1,025ｈａ）",
  "seoDescription": "2022年の農地の転用面積の都道府県別ランキング。1位茨城県（1,025ｈａ）、最下位高知県（78ｈａ）で13.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

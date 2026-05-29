import type { MetricConfig } from "../types";

export const liverDiseaseDeathRate: MetricConfig = {
  "key": "liver-disease-death-rate",
  "title": "肝疾患による死亡者数",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0003411663",
    "cdCat01": "11300",
    "displayName": "人口動態調査",
    "url": "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/kakutei23/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateReds",
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
  "groupKey": "liver-disease-death-count",
  "seoTitle": "肝疾患による死亡者数ランキング都道府県【2023年】｜1位沖縄県（28.6人）",
  "seoDescription": "2023年の肝疾患による死亡者数の都道府県別ランキング。1位沖縄県（28.6人）、最下位滋賀県（11.1人）で2.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

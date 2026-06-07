import type { MetricConfig } from "../types";

export const portVehicleFerry: MetricConfig = {
  "key": "port-vehicle-ferry",
  "title": "自動車航送車両台数（港湾統計）",
  "unit": "台",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0003130796",
    "cdCat01": "100",
    "cdCat02": "100",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2009,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 1,
    "displayUnit": "万台",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "台/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "台/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "自動車航送車両台数（港湾統計）ランキング都道府県【2023年】｜1位鹿児島県（3,582,800台）",
  "seoDescription": "2023年の自動車航送車両台数（港湾統計）の都道府県別ランキング。1位鹿児島県（3,582,800台）、最下位鳥取県（10,454台）で342.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

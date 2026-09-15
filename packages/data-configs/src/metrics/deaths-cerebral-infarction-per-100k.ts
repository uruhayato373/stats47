import type { MetricConfig } from "../types";

export const deathsCerebralInfarctionPer100k: MetricConfig = {
  "key": "deaths-cerebral-infarction-per-100k",
  "title": "脳梗塞による死亡者数",
  "subtitle": "人口10万人当たり",
  "description": "人口動態調査が公表する脳梗塞(ICD-10のI63等)による死亡率(人口10万対)の値です。年齢調整死亡率ではありません。",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0003411663",
    "cdCat01": "09303",
    "displayName": "人口動態調査",
    "url": "https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00450011",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2015,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};

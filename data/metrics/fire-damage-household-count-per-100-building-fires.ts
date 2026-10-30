import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const fireDamageHouseholdCountPer100BuildingFires: MetricConfig = {
  "key": "fire-damage-household-count-per-100-building-fires",
  "title": "火災り災世帯数",
  "subtitle": "建物火災100件当たり",
  "unit": "世帯",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K02301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
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
        "unit": "世帯/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "世帯/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "火災り災世帯数ランキング都道府県【2023年】｜1位大阪府（110.3世帯）",
  "seoDescription": "2023年の火災り災世帯数の都道府県別ランキング。1位大阪府（110.3世帯）、最下位沖縄県（59.6世帯）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

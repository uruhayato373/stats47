import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const deathsMalignantNeoplasmsPer100k: MetricConfig = {
  "key": "deaths-malignant-neoplasms-per-100k",
  "title": "腫瘍による死亡者数",
  "description": "人口動態調査の悪性新生物による死亡者数を日本人人口で除し、10万倍した値です。年齢調整死亡率ではありません。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I06102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
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
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "isActive": true,
  "subtitle": "日本人人口10万人当たり",
  "denominator": { "kind": "population", "per": 100000, "scope": "日本人" },
};

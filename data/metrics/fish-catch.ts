import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const fishCatch: MetricConfig = {
  "key": "fish-catch",
  "title": "漁獲量",
  "description": "海面漁業と内水面漁業で採捕された水産動植物を、採捕時の原形重量で合計した量です。",
  "note": "養殖業の収獲量は含みません。内水面漁業は調査対象となる河川・湖沼の範囲が時期により異なるため、長期比較には注意が必要です。",
  "unit": "トン",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3121",
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
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "トン/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "トン/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "fishery",
  "isActive": true,
};

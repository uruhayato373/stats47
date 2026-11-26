import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const windPowerPlantCountFacility: MetricConfig = {
  "key": "wind-power-plant-count-facility",
  "title": "風力発電施設数（施設ベース）",
  "unit": "か所",
  "category": "energy",
  "source": {
    "kind": "external",
    "fetcherKey": "mlit_ksj",
    "config": {
      "source": {
        "name": "国土数値情報",
        "url": "https://nlftp.mlit.go.jp/ksj/index.html",
      },
      "ksjDataId": "P03",
      "ksjVersion": "13",
      "description": "風力発電施設数（施設ベース）",
    },
    "displayName": "国土数値情報",
    "url": "https://nlftp.mlit.go.jp/ksj/index.html",
  },
  "surveyId": "mlit-ksj",
  "entities": [
    "prefecture",
  ],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential",
  },
  "years": {
    "from": 2013,
    "to": 2013,
  },
  "yearFormat": "calendar",
  "calculation": {
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "か所/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "か所/100km²",
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  // 2026-08-17: 県の帰属を最寄り県庁所在地から属性/空間結合へ是正し値が変わった
  // (KSJ-PREF-ASSIGN-01)。
  "isActive": false,
};

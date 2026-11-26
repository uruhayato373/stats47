import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const totalPopulation: MetricConfig = {
  "key": "total-population",
  "title": "総人口",
  "subtitle": "総数",
  "description": "国勢調査または人口推計に基づく、各地域の人口の総数です。",
  "note": "2025年は令和7年国勢調査の確定値です。国勢調査の間の年は人口推計（千人単位）です。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A1101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1975,
    "to": 2025,
  },
  "supplementalSources": [
    {
      "years": [2025],
      "source": {
        "kind": "estat",
        "statsDataId": "0004065881",
        "cdTab": "2025_01",
        "cdCat01": "0",
        "displayName": "国勢調査",
        "url": "https://www.e-stat.go.jp/dbview?sid=0004065881",
      },
      "reason": "社会・人口統計体系に令和7年国勢調査（2026-09-29公表）が未反映のため、国勢調査の原数値の表から直接取る",
    },
  ],
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
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
        "denominator": { "kind": "area", "per": 100 },
        "unit": "人/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};

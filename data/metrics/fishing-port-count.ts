import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const fishingPortCount: MetricConfig = {
  "key": "fishing-port-count",
  "title": "漁港数",
  "subtitle": "総数（水産庁）",
  "unit": "港",
  "category": "agriculture",
  "source": {
    "kind": "external",
    "fetcherKey": "mlit_ksj",
    "config": {
      "source": {
        "name": "国土数値情報（漁港）",
        "url": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-C09.html",
      },
      "ksjDataId": "C09",
      "ksjVersion": "06",
      "note": "fishing_ports テーブル（is_active=1）から集計",
    },
    "displayName": "国土数値情報（漁港）",
    "url": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-C09.html",
  },
  "surveyId": "mlit-ksj",
  "entities": [
    "prefecture",
  ],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
  },
  "years": {
    "from": 2006,
    "to": 2006,
  },
  "yearFormat": "plain",
  "calculation": {
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "港/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "港/100km²",
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "isActive": false,
};

import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const censusHouseholdChangeRate5y: MetricConfig = {
  "key": "census-household-change-rate-5y",
  "title": "5年間の世帯増減率",
  "subtitle": "2020年→2025年（国勢調査）",
  "description": "2025年国勢調査（確定値）の世帯数を、2025年10月1日現在の境域に組み替えた2020年国勢調査の世帯数と比べた5年間の増減率（%）です。",
  "note": "令和7年国勢調査 人口等基本集計（2026年9月29日公表）。人口が減っても一人暮らしなど世帯の小規模化で世帯数は増えることがあります。",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0004065882",
    "cdTab": "2025_37",
    "displayName": "国勢調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004065882",
  },
  "citySource": {
    "kind": "estat",
    "statsDataId": "0004065882",
    "cdTab": "2025_37",
    "displayName": "国勢調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004065882",
  },
  "surveyId": "census",
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2025,
    "to": 2025,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateRdYlGn",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};

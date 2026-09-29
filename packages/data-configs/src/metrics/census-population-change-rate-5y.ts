import type { MetricConfig } from "../types";

export const censusPopulationChangeRate5y: MetricConfig = {
  "key": "census-population-change-rate-5y",
  "title": "5年間の人口増減率",
  "subtitle": "2020年→2025年（国勢調査）",
  "description": "2025年国勢調査（確定値）の人口を、2025年10月1日現在の境域に組み替えた2020年国勢調査の人口と比べた5年間の増減率（%）です。",
  "note": "令和7年国勢調査 人口等基本集計（2026年9月29日公表）。年次の人口推計に基づく「人口増減率」とは期間と出典が異なります。",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0004065882",
    "cdTab": "2025_35",
    "displayName": "国勢調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004065882",
  },
  "citySource": {
    "kind": "estat",
    "statsDataId": "0004065882",
    "cdTab": "2025_35",
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
    "colorScheme": "interpolateRdYlGn",
    "colorSchemeType": "diverging",
    "minValueType": "data-min",
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

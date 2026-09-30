import type { MetricConfig } from "../types";

export const censusPopulationChange5y: MetricConfig = {
  "key": "census-population-change-5y",
  "title": "5年間の人口増減数",
  "subtitle": "2020年→2025年（国勢調査）",
  "description": "2025年国勢調査（確定値）の人口と、2025年10月1日現在の境域に組み替えた2020年国勢調査の人口との差（人）です。",
  "note": "令和7年国勢調査 人口等基本集計（2026年9月29日公表）。人数の差なので人口の多い地域ほど大きく出ます。規模を除いた比較は「5年間の人口増減率」を参照してください。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0004065882",
    "cdTab": "2025_34",
    "displayName": "国勢調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004065882",
  },
  "citySource": {
    "kind": "estat",
    "statsDataId": "0004065882",
    "cdTab": "2025_34",
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};

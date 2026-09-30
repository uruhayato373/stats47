import type { MetricConfig } from "../types";

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
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "総人口ランキング都道府県【2025年】｜1位東京都（14,236,627人）",
  "seoDescription": "2025年の総人口（令和7年国勢調査）の都道府県別ランキング。1位東京都（14,236,627人）、最下位鳥取県（523,073人）で27.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

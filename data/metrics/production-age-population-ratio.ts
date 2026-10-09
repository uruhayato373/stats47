import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const productionAgePopulationRatio: MetricConfig = {
  "key": "production-age-population-ratio",
  "title": "15～64歳人口割合",
  "note": "2025年は令和7年国勢調査の原数値（年齢「不詳」を除いて算出）で、2020年以前の国勢調査年と同じ定義です。報道で使われる不詳補完値とは小数点以下が異なります。",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A03502",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      2020,
      2024,
      2025,
    ],
  },
  "supplementalSources": [
    {
      "years": [2025],
      "source": {
        "kind": "estat",
        "statsDataId": "0004065933",
        "cdTab": "2025_42",
        "cdCat01": "0",
        "cdCat02": "0",
        "cdCat03": "2",
        "displayName": "国勢調査",
        "url": "https://www.e-stat.go.jp/dbview?sid=0004065933",
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "15～64歳人口割合ランキング都道府県【2025年】｜1位東京都（66.6％）",
  "seoDescription": "2025年の15～64歳人口割合（令和7年国勢調査）の都道府県別ランキング。1位東京都（66.6％）、最下位秋田県（51.3％）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

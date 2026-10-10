import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const ratio65Plus: MetricConfig = {
  "key": "ratio-65-plus",
  "title": "65歳以上人口割合",
  "subtitle": "65歳以上割合",
  "description": "65歳以上人口を総人口で除して100を掛けた割合です。",
  "note": "2025年は令和7年国勢調査の原数値（年齢「不詳」を除いて算出）で、2020年以前の国勢調査年と同じ定義です。報道で使われる不詳補完値とは小数点以下が異なります。",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A03503",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2005,
    "to": 2025,
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
        "cdCat03": "3",
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
  "seoTitle": "65歳以上人口割合ランキング都道府県【2025年】｜1位秋田県（40.1％）",
  "seoDescription": "2025年の65歳以上人口割合（令和7年国勢調査）の都道府県別ランキング。1位秋田県（40.1％）、最下位東京都（22.8％）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

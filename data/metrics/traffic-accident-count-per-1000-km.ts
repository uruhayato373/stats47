import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const trafficAccidentCountPer1000Km: MetricConfig = {
  "key": "traffic-accident-count-per-1000-km",
  "title": "交通事故発生件数",
  "subtitle": "道路1000km当たり",
  "unit": "件",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K04102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1980,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
        1979,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "traffic-accident-count",
  "seoTitle": "交通事故発生件数ランキング都道府県【2023年】｜1位大阪府（1,311.1件）",
  "seoDescription": "2023年の交通事故発生件数の都道府県別ランキング。1位大阪府（1,311.1件）、最下位島根県（41.6件）で31.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

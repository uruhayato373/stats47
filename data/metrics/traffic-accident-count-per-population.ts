import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const trafficAccidentCountPerPopulation: MetricConfig = {
  "key": "traffic-accident-count-per-population",
  "title": "交通事故発生件数",
  "subtitle": "人口10万人当たり",
  "unit": "件",
  "category": "safetyenvironment",
  "description": "交通事故統計の交通事故発生件数を総人口で除し、人口10万人当たりに換算した値。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K04101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1976,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
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
  },
  "groupKey": "traffic-accident-count",
  "seoTitle": "交通事故発生件数（人口10万人当たり）ランキング都道府県",
  "seoDescription": "人口10万人当たりの交通事故発生件数を都道府県別に比較。総数とは区別し、人口規模を揃えて地域差と経年変化を地図やグラフで確認できます。",
  "isActive": true,
};

import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const workAccidentSeverity: MetricConfig = {
  "key": "work-accident-severity",
  "title": "労働災害の重さの程度",
  "unit": "（日/時間）",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F08202",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "労働災害の重さの程度ランキング都道府県【2023年】｜1位香川県（1.08）",
  "seoDescription": "2023年の労働災害の重さの程度の都道府県別ランキング。1位香川県（1.08）、最下位徳島県（0.02）で54.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

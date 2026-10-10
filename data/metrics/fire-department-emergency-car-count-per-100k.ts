import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const fireDepartmentEmergencyCarCountPer100k: MetricConfig = {
  "key": "fire-department-emergency-car-count-per-100k",
  "title": "救急自動車数",
  "unit": "台",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I11102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1983,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
        1979,
        1980,
        1981,
        1982,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "台/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "台/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "救急自動車数ランキング都道府県【2024年】｜1位島根県（12台）",
  "seoDescription": "2024年の救急自動車数の都道府県別ランキング。1位島根県（12台）、最下位東京都（2.7台）で4.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

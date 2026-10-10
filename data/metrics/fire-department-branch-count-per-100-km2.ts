import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const fireDepartmentBranchCountPer100Km2: MetricConfig = {
  "key": "fire-department-branch-count-per-100-km2",
  "title": "消防団・分団数",
  "unit": "団",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K01104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1978,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
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
        "unit": "団/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "団/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "消防団・分団数ランキング都道府県【2024年】｜1位東京都（57.3団）",
  "seoDescription": "2024年の消防団・分団数の都道府県別ランキング。1位東京都（57.3団）、最下位北海道（5.5団）で10.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

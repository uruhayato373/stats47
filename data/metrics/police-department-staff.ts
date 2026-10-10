import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const policeDepartmentStaff: MetricConfig = {
  "key": "police-department-staff",
  "title": "警察部門職員数",
  "unit": "人",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D1205",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2002,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1998,
        1999,
        2000,
        2001,
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "警察部門職員数ランキング都道府県【2024年】｜1位東京都（46,929人）",
  "seoDescription": "2024年の警察部門職員数の都道府県別ランキング。1位東京都（46,929人）、最下位鳥取県（1,438人）で32.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

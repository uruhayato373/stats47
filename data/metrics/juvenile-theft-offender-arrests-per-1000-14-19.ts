import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const juvenileTheftOffenderArrestsPer10001419: MetricConfig = {
  "key": "juvenile-theft-offender-arrests-per-1000-14-19",
  "title": "少年窃盗犯検挙人員",
  "unit": "人",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K06304",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2003,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1980,
        1985,
        1990,
        1995,
        2000,
        2002,
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
    "decimalPlaces": 2,
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
  "seoTitle": "少年窃盗犯検挙人員ランキング都道府県【2023年】｜1位沖縄県（2.82人）",
  "seoDescription": "2023年の少年窃盗犯検挙人員の都道府県別ランキング。1位沖縄県（2.82人）、最下位青森県（0.68人）で4.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

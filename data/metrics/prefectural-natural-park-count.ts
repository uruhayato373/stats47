import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const prefecturalNaturalParkCount: MetricConfig = {
  "key": "prefectural-natural-park-count",
  "title": "都道府県立自然公園数",
  "unit": "箇所",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010102",
    "cdCat01": "B2102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1979,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateGreens",
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
        "unit": "箇所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "箇所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "都道府県立自然公園数ランキング都道府県【2024年】｜1位高知県（18箇所）",
  "seoDescription": "2024年の都道府県立自然公園数の都道府県別ランキング。1位高知県（18箇所）、最下位群馬県（0箇所）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};

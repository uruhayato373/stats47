import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const gradeSeparatedPedestrianCrossingsPer1000Km: MetricConfig = {
  "key": "grade-separated-pedestrian-crossings-per-1000-km",
  "title": "立体横断施設数",
  "unit": "所",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K03102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1985,
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
        1980,
        1981,
        1982,
        1983,
        1984,
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
        "unit": "所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "立体横断施設数ランキング都道府県【2023年】｜1位東京都（46所）",
  "seoDescription": "2023年の立体横断施設数の都道府県別ランキング。1位東京都（46所）、最下位北海道（3.2所）で14.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

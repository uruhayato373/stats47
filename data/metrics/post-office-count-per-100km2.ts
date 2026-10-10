import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const postOfficeCountPer100km2: MetricConfig = {
  "key": "post-office-count-per-100km2",
  "title": "郵便局数",
  "subtitle": "面積100km²当たり",
  "unit": "局",
  "category": "ict",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H06302",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1984,
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
        1983,
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
        "unit": "局/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "局/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "post-office-count",
  "seoTitle": "郵便局数ランキング都道府県【2024年】｜1位東京都（105.27局）",
  "seoDescription": "2024年の郵便局数の都道府県別ランキング。1位東京都（105.27局）、最下位北海道（6.57局）で16.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const urbanParkAreaPerPerson: MetricConfig = {
  "key": "urban-park-area-per-person",
  "title": "都市公園面積",
  "subtitle": "1人当たり",
  "unit": "ｍ2",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H08101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1978,
    "to": 2023,
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
    "colorScheme": "interpolateOranges",
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
        "unit": "ｍ2/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "ｍ2/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "urban-parks-area",
  "seoTitle": "都市公園面積ランキング都道府県【2023年】｜1位北海道（27.84ｍ2）",
  "seoDescription": "2023年の都市公園面積の都道府県別ランキング。1位北海道（27.84ｍ2）、最下位東京都（4.34ｍ2）で6.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

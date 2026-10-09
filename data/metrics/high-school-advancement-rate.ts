import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const highSchoolAdvancementRate: MetricConfig = {
  "key": "high-school-advancement-rate",
  "title": "高等学校卒業者の進学率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E09402",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2001,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        2000,
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
  },
  "seoTitle": "高等学校卒業者の進学率ランキング都道府県【2023年】｜1位東京都（74.1％）",
  "seoDescription": "2023年の高等学校卒業者の進学率の都道府県別ランキング。1位東京都（74.1％）、最下位沖縄県（46.7％）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

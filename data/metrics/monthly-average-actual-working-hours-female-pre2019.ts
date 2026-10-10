import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const monthlyAverageActualWorkingHoursFemalePre2019: MetricConfig = {
  "key": "monthly-average-actual-working-hours-female-pre2019",
  "title": "月間平均実労働時間数",
  "subtitle": "女性（〜2018年）",
  "unit": "時間",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F0610102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1977,
    "to": 2019,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
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
        "unit": "時間/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "時間/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "月間平均実労働時間数ランキング都道府県【2019年】｜1位岐阜県（172時間）",
  "seoDescription": "2019年の月間平均実労働時間数の都道府県別ランキング。1位岐阜県（172時間）、最下位東京都（162時間）で1.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

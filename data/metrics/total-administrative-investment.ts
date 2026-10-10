import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const totalAdministrativeInvestment: MetricConfig = {
  "key": "total-administrative-investment",
  "title": "行政総投資額",
  "unit": "千円",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D5100",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1982,
    "to": 2022,
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
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "行政総投資額ランキング都道府県【2022年】｜1位東京都（2,589,062,062）",
  "seoDescription": "2022年の行政総投資額の都道府県別ランキング。1位東京都（2,589,062,062）、最下位香川県（167,393,339）で15.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const employmentInsuranceBasicBenefitAverage: MetricConfig = {
  "key": "employment-insurance-basic-benefit-average",
  "title": "雇用保険基本手当平均支給額",
  "subtitle": "月次平均",
  "unit": "千円",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F07102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1990,
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
        1985,
        1986,
        1987,
        1988,
        1989,
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
        "unit": "千円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "千円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "雇用保険基本手当平均支給額ランキング都道府県【2023年】｜1位東京都（1,779.8千円）",
  "seoDescription": "2023年の雇用保険基本手当平均支給額の都道府県別ランキング。1位東京都（1,779.8千円）、最下位秋田県（1,404.2千円）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

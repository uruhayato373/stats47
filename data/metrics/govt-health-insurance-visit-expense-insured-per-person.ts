import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const govtHealthInsuranceVisitExpenseInsuredPerPerson: MetricConfig = {
  "key": "govt-health-insurance-visit-expense-insured-per-person",
  "title": "政府管掌健康保険受診金額",
  "subtitle": "被保険者1人当たり",
  "unit": "円",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I1520401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2000,
    "to": 2007,
  },
  "yearExclusions": [
    {
      "years": [
        1985,
        1986,
        1987,
        1988,
        1989,
        1990,
        1991,
        1992,
        1993,
        1994,
        1995,
        1996,
        1997,
        1998,
        1999,
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
        "unit": "円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "政府管掌健康保険受診金額ランキング都道府県【2007年】｜1位奈良県（110,256円）",
  "seoDescription": "2007年の政府管掌健康保険受診金額の都道府県別ランキング。1位奈良県（110,256円）、最下位東京都（57,849円）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

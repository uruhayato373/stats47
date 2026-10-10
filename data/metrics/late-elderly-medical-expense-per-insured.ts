import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const lateElderlyMedicalExpensePerInsured: MetricConfig = {
  "key": "late-elderly-medical-expense-per-insured",
  "title": "後期高齢者医療費",
  "description": "後期高齢者医療制度の医療費を被保険者1人当たりに換算した金額です。",
  "unit": "円",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J05208",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1996,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "後期高齢者医療費ランキング都道府県【2023年】｜1位福岡県（1,195,147円）",
  "seoDescription": "2023年の後期高齢者医療費の都道府県別ランキング。1位福岡県（1,195,147円）、最下位新潟県（775,287円）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "subtitle": "被保険者1人当たり"
};

import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const householdHeadIncomeWorkerHouseholdsPerMonth: MetricConfig = {
  "key": "household-head-income-worker-households-per-month",
  "title": "世帯主収入",
  "subtitle": "1世帯当たり1か月間",
  "unit": "円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L01204",
    "valueScale": 1000,
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "yearFormat": "calendar",
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
    "isCalculated": false
  },
  "seoTitle": "世帯主収入のランキング｜県庁所在市の勤労者世帯の月額",
  "seoDescription": "家計調査の二人以上の勤労者世帯について、県庁所在市ごとの世帯主の 1 か月の収入を比較。各都市の値、対象年、出典と集計上の注意を確認できます。",
  "isActive": true,
};

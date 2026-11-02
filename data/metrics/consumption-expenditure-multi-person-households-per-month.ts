import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const consumptionExpenditureMultiPersonHouseholdsPerMonth: MetricConfig = {
  "key": "consumption-expenditure-multi-person-households-per-month",
  "title": "消費支出",
  "subtitle": "1世帯当たり1か月間・二人以上の世帯・1か月平均",
  "unit": "千円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02211",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2000,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "消費支出のランキング｜県庁所在市の二人以上世帯の1か月平均",
  "seoDescription": "家計調査の二人以上世帯について、県庁所在市ごとの 1 世帯当たり 1 か月の消費支出を比較。各都市の値、対象年、出典と集計上の注意を確認できます。",
  "isActive": true,
};

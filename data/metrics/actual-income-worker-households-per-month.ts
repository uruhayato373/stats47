import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const actualIncomeWorkerHouseholdsPerMonth: MetricConfig = {
  "key": "actual-income-worker-households-per-month",
  "title": "実収入",
  "description": "家計調査の二人以上の世帯のうち勤労者世帯について、勤め先収入、事業・内職収入、社会保障給付等の経常収入と特別収入を合計した、1世帯当たり年平均1か月間の税込み収入。",
  "note": "都道府県値は県庁所在都市別で、都道府県全域の平均ではない。預貯金の引出し、保険金の受取り、借入金など、資産減少や負債増加を伴う実収入以外の受取は含まない。",
  "unit": "千円",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L01201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1975,
    "to": 2024
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "実収入のランキング｜県庁所在市の二人以上の勤労者世帯の月額",
  "seoDescription": "家計調査の二人以上の勤労者世帯について、県庁所在市ごとの 1 世帯当たり月額の実収入を比較。各都市の値、対象年、出典と集計上の注意を確認できます。",
  "isActive": true,
  "subtitle": "二人以上の勤労者世帯・1世帯当たり月額"
};

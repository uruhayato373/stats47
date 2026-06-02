import type { MetricConfig } from "../types";

export const futureBurdenRatioCity: MetricConfig = {
  "key": "future-burden-ratio-city",
  "title": "将来負担比率（市町村財政）",
  "subtitle": "市町村分",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020204",
    "cdCat01": "D2212",
    "displayName": "社会・人口統計体系（市区町村データ・廃置分合処理済）",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 2011,
    "to": 2021,
  },
  "yearFormat": "fiscal",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

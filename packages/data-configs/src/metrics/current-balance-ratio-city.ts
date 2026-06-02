import type { MetricConfig } from "../types";

export const currentBalanceRatioCity: MetricConfig = {
  "key": "current-balance-ratio-city",
  "title": "経常収支比率（市町村財政）",
  "subtitle": "市町村財政",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020204",
    "cdCat01": "D2203",
    "displayName": "社会・人口統計体系（市区町村データ・廃置分合処理済）",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 2000,
    "to": 2021,
  },
  "yearFormat": "fiscal",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

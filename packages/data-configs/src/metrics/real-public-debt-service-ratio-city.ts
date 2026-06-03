import type { MetricConfig } from "../types";

export const realPublicDebtServiceRatioCity: MetricConfig = {
  "key": "real-public-debt-service-ratio-city",
  "title": "実質公債費比率（市町村財政）",
  "subtitle": "市町村分",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020204",
    "cdCat01": "D2211",
    "displayName": "社会・人口統計体系（市区町村データ・廃置分合処理済）",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 2008,
    "to": 2021,
  },
  "yearFormat": "fiscal",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

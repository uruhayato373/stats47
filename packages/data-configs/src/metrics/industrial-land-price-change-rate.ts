import type { MetricConfig } from "../types";

export const industrialLandPriceChangeRate: MetricConfig = {
  "key": "industrial-land-price-change-rate",
  "title": "標準価格変動率（工業地）",
  "unit": "%",
  "category": "miningindustry",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C5505",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": "all",
  "yearFormat": "fiscal",
  "seoTitle": "標準価格（対前年平均変動率）（工業地）",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

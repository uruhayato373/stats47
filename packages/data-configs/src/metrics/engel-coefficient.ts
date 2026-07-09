import type { MetricConfig } from "../types";

export const engelCoefficient: MetricConfig = {
  "key": "engel-coefficient",
  "title": "エンゲル係数",
  "subtitle": "都道府県庁所在市の二人以上世帯の消費支出に占める食料費の割合",
  "note": "エンゲル係数が高い都市には、生活費に占める食料の負担が重い場合だけでなく、外食・高級食材など食生活が豊かな場合も含まれる（東京・京都など）",
  "description": "消費支出に占める食料費の割合（食料費÷消費支出×100）。伝統的には生活水準の指標とされてきたが、現代日本の地域比較では食文化の豊かさ（外食・高級食材への支出）を反映して都市部で高くなる傾向があり、単純に「高い=貧しい」とは読めない。",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "external",
    "fetcherKey": "calculated",
    "config": {},
    "displayName": "家計調査",
    "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2007,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": true,
    "type": "ratio",
    "numeratorKey": "food-expenditure-total",
    "denominatorKey": "consumption-expenditure-total",
  },
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

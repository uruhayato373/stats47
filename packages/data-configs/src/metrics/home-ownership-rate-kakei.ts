import type { MetricConfig } from "../types";

export const homeOwnershipRateKakei: MetricConfig = {
  "key": "home-ownership-rate-kakei",
  "title": "持家率",
  "subtitle": "家計調査（二人以上世帯）の調査世帯に占める持家世帯の割合",
  "note": "家計調査の調査世帯（都道府県庁所在市の二人以上世帯）ベースの持家率。全世帯調査（住宅・土地統計調査）とは水準が異なる場合がある",
  "description": "家計調査（二人以上世帯）の調査世帯に占める持家世帯の割合。都市部ほど低く、地方ほど高い傾向があり、住宅事情の地域差を示す。",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0003348239",
      "cdCat01": "000900000",
      "cdCat02": "03",
    },
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
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

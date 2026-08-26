import type { MetricConfig } from "../types";

export const bathroomHousingRatio: MetricConfig = {
  "key": "bathroom-housing-ratio",
  "title": "浴室のある住宅比率",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H02303",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2008,
    "to": 2008,
  },
  "yearFormat": "fiscal",
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
    "isCalculated": false,
  },
  "seoTitle": "浴室のある住宅比率 都道府県ランキング【2008年】｜1位島根県（98.6％）",
  "seoDescription": "2008年の浴室のある住宅比率を都道府県別に比較。1位は島根県（98.6％）、最下位は東京都（91.4％）、最大と最小の差は1.1倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};

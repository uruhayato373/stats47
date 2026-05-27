import type { MetricConfig } from "../types";

export const sewerageCoverageRate: MetricConfig = {
  "key": "sewerage-coverage-rate",
  "title": "下水道処理人口普及率",
  "unit": "％",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H5411",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
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
  "seoTitle": "下水道処理人口普及率ランキング都道府県【2023年】｜1位東京都（99.7％）",
  "seoDescription": "2023年の下水道処理人口普及率の都道府県別ランキング。1位東京都（99.7％）、最下位徳島県（19.5％）で5.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

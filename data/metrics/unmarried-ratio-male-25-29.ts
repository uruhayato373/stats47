import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const unmarriedRatioMale2529: MetricConfig = {
  "key": "unmarried-ratio-male-25-29",
  "title": "未婚者割合",
  "subtitle": "男性 25〜29歳",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A0410401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1980,
      1985,
      1990,
      1995,
      2000,
      2005,
      2010,
      2015,
      2020,
    ],
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "isReversed": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "未婚者割合 都道府県ランキング【2020年】｜1位富山県（72.1％）",
  "seoDescription": "2020年の未婚者割合を都道府県別に比較。1位は富山県（72.1％）、最下位は東京都（59.4％）、最大と最小の差は1.2倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};

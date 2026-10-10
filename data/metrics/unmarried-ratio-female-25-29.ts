import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const unmarriedRatioFemale2529: MetricConfig = {
  "key": "unmarried-ratio-female-25-29",
  "title": "未婚者割合",
  "subtitle": "女性 25〜29歳",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A0410402",
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
  "seoTitle": "未婚者割合ランキング都道府県【2020年】｜1位奈良県（65.1％）",
  "seoDescription": "2020年の未婚者割合の都道府県別ランキング。1位奈良県（65.1％）、最下位宮崎県（53.6％）で1.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

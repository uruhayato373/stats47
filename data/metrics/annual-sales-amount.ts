import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const annualSalesAmount: MetricConfig = {
  "key": "annual-sales-amount",
  "title": "商業年間商品販売額",
  "subtitle": "総額",
  "unit": "百万円",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3501",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2020,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1978,
        1981,
        1984,
        1987,
        1990,
        1993,
        1996,
        1998,
        2001,
        2003,
        2006,
        2011,
        2013,
        2015,
        2018,
        2019,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "百万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "百万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "annual-sales-amount",
  "seoTitle": "商業年間商品販売額ランキング都道府県【2022年】｜1位東京都（211,933,731百万円）",
  "seoDescription": "2022年の商業年間商品販売額の都道府県別ランキング。1位東京都（211,933,731百万円）、最下位鳥取県（1,302,355百万円）で162.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const turnoverRate: MetricConfig = {
  "key": "turnover-rate",
  "title": "離職率",
  "description": "1年前には仕事をしていたが現在は仕事をしていない離職者数を、継続就業者数・転職者数・離職者数の合計で割り、100倍した値。",
  "note": "就業構造基本調査で、ふだんの就業状態と1年前の状態を比較した指標。調査は5年ごとに実施される。",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F04102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1977,
      1979,
      1982,
      1987,
      1992,
      1997,
      2002,
      2007,
      2012,
      2017,
      2022
    ],
  },
  "yearFormat": "fiscal",
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
  "seoTitle": "離職率ランキング都道府県【2022年】｜1位宮城県（4.6％）",
  "seoDescription": "2022年の離職率の都道府県別ランキング。1位宮城県（4.6％）、最下位福井県（3％）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

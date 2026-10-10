import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const employedOutsideThePrefecturePre2018: MetricConfig = {
  "key": "employed-outside-the-prefecture-pre2018",
  "title": "県外就職者比率",
  "subtitle": "～2018年",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F03102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2000,
    "to": 2018,
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
  "seoTitle": "県外就職者比率ランキング都道府県【2018年】｜1位千葉県（33.5％）",
  "seoDescription": "2018年の県外就職者比率の都道府県別ランキング。1位千葉県（33.5％）、最下位北海道（3.8％）で8.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

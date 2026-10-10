import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const publicSwimmingPoolCountPerMillion: MetricConfig = {
  "key": "public-swimming-pool-count-per-million",
  "title": "水泳プール数",
  "subtitle": "屋内・屋外",
  "unit": "施設",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010207",
    "cdCat01": "#G01326",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1980,
      1981,
      1982,
      1983,
      1984,
      1985,
      1986,
      1987,
      1988,
      1989,
      1990,
      1991,
      1992,
      1993,
      1994,
      1995,
      1996,
      1997,
      1999,
      2002,
      2005,
      2008,
      2011,
      2015,
      2018,
      2021,
    ],
  },
  "yearExclusions": [
    {
      "years": [
        1978,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "施設/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "施設/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "水泳プール数ランキング都道府県【2021年】｜1位北海道（52.9施設）",
  "seoDescription": "2021年の水泳プール数の都道府県別ランキング。1位北海道（52.9施設）、最下位埼玉県（9.9施設）で5.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const publicBathCountPer100k: MetricConfig = {
  "key": "public-bath-count-per-100k",
  "title": "公衆浴場数",
  "subtitle": "人口10万人当たり",
  "unit": "所",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H06121",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1994,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
        1979,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "public-bath-count",
  "seoTitle": "公衆浴場数ランキング都道府県【2023年】｜1位青森県（22.5所）",
  "seoDescription": "2023年の公衆浴場数の都道府県別ランキング。1位青森県（22.5所）、最下位茨城県（0所）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};

import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const publicBondExpensesNaturePrefecture: MetricConfig = {
  "key": "public-bond-expenses-nature-prefecture",
  "title": "公債費",
  "subtitle": "性質別歳出内訳 都道府県財政",
  "unit": "千円",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D310409",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2009,
    "to": 2022,
  },
  "yearExclusions": [
    {
      "years": [
        2005,
        2006,
        2007,
        2008,
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
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "公債費ランキング都道府県【2022年】｜1位大阪府（399,371,320）",
  "seoDescription": "2022年の公債費の都道府県別ランキング。1位大阪府（399,371,320）、最下位鳥取県（50,160,830）で8.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

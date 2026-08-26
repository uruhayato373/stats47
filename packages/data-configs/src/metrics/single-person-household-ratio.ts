import type { MetricConfig } from "../types";

export const singlePersonHouseholdRatio: MetricConfig = {
  "key": "single-person-household-ratio",
  "title": "単独世帯割合",
  "description": "国勢調査の一般世帯数に占める、世帯人員が1人の単独世帯数の割合。",
  "note": "一般世帯には一戸を構える単身者のほか、間借り・下宿の単身者や会社などの寄宿舎・独身寮に住む単身者を含む。施設等の世帯は分母に含まれない。",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A06205",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "単独世帯割合ランキング都道府県【2020年】｜1位東京都（50.24％）",
  "seoDescription": "2020年の単独世帯割合の都道府県別ランキング。1位東京都（50.24％）、最下位山形県（28.43％）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

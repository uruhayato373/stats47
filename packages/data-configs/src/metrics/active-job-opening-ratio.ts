import type { MetricConfig } from "../types";

export const activeJobOpeningRatio: MetricConfig = {
  "key": "active-job-opening-ratio",
  "title": "有効求人倍率",
  "description": "公共職業安定所における一般の月間有効求人数の年度計を、一般の月間有効求職者数の年度計で割った値。求職者1人当たりの求人数を表す。",
  "note": "新規学卒者とパートタイムを含まない。年度計は各月の有効求人・求職者を足した延べ数で、同じ求人・求職者が複数月に計上され得る。",
  "unit": "倍",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F03103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 1,
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "有効求人倍率ランキング都道府県【2022年】｜1位福井県（1.94倍）",
  "seoDescription": "2022年の有効求人倍率の都道府県別ランキング。1位福井県（1.94倍）、最下位神奈川県（0.88倍）で2.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

import type { MetricConfig } from "../types";

export const employmentRate: MetricConfig = {
  "key": "employment-rate",
  "title": "就職率",
  "description": "公共職業安定所における一般の就職件数の年度計を、一般の月間有効求職者数の年度計で割り、100倍した値。",
  "note": "新規学卒者とパートタイムを含まない。月間有効求職者数の年度計は各月の有効求職者を足した延べ人数で、同じ求職者が複数月に計上され得る。",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F03101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1986,
    "to": 2021,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "就職率ランキング都道府県【2021年】｜1位福井県（9.5％）",
  "seoDescription": "2021年の就職率の都道府県別ランキング。1位福井県（9.5％）、最下位東京都（2.1％）で4.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

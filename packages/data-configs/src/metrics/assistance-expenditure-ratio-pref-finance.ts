import type { MetricConfig } from "../types";

export const assistanceExpenditureRatioPrefFinance: MetricConfig = {
  "key": "assistance-expenditure-ratio-pref-finance",
  "title": "扶助費割合",
  "subtitle": "都道府県財政",
  "description": "都道府県の歳出総額に占める扶助費の割合。社会保障関係の給付的経費が財政規模に対してどの程度あるかを示す。",
  "unit": "％",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0320201",
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
  "seoTitle": "扶助費割合ランキング都道府県【2022年】｜1位愛媛県（4.33％）",
  "seoDescription": "2022年の扶助費割合の都道府県別ランキング。1位愛媛県（4.33％）、最下位新潟県（0.79％）で5.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

import type { MetricConfig } from "../types";

export const currentLifeInsuranceBalanceRatioMultiPersonHouseholds: MetricConfig = {
  "key": "current-life-insurance-balance-ratio-multi-person-households",
  "title": "生命保険現在高割合",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L07213",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2019,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "生命保険現在高割合ランキング都道府県【2019年】｜1位鹿児島県（29.9％）",
  "seoDescription": "2019年の生命保険現在高割合の都道府県別ランキング。1位鹿児島県（29.9％）、最下位愛知県（16.3％）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

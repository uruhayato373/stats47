import type { MetricConfig } from "../types";

export const depositBalancePerPerson: MetricConfig = {
  "key": "deposit-balance-per-person",
  "title": "預貯金残高",
  "subtitle": "1人当たり",
  "unit": "万円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C04601",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1985,
    "to": 2004,
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "deposit-balance",
  "seoTitle": "預貯金残高ランキング都道府県【2004年】｜1位東京都（1,552.9万円）",
  "seoDescription": "2004年の預貯金残高の都道府県別ランキング。1位東京都（1,552.9万円）、最下位沖縄県（398.3万円）で3.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

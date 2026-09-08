import type { MetricConfig } from "../types";

export const annualIncomePerHousehold: MetricConfig = {
  "key": "annual-income-per-household",
  "title": "年間収入",
  "unit": "千円",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L07601",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2019,
    "to": 2019
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "年間収入ランキング都道府県【2019年】｜1位神奈川県（6,220千円）",
  "seoDescription": "2019年の年間収入の都道府県別ランキング。1位神奈川県（6,220千円）、最下位沖縄県（4,215千円）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "subtitle": "1世帯当たり"
};

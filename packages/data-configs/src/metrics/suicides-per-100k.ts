import type { MetricConfig } from "../types";

export const suicidesPer100k: MetricConfig = {
  "key": "suicides-per-100k",
  "title": "自殺者数",
  "subtitle": "日本人人口10万人当たり",
  "unit": "人",
  "category": "safetyenvironment",
  "description": "人口動態調査の死因簡単分類で「自殺」に分類された死亡者数を日本人人口で除し、日本人人口10万人当たりに換算した値。",
  "note": "暦年の人口動態統計に基づく死亡率で、分母は総人口ではなく日本人人口である。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I06201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2023,
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
  "groupKey": "suicide-count",
  "seoTitle": "自殺者数（日本人人口10万人当たり）ランキング都道府県",
  "seoDescription": "日本人人口10万人当たりの自殺者数を都道府県別に比較。総数とは区別して、同じ分母の指標で地域差と経年変化を確認できます。",
  "isActive": true,
};

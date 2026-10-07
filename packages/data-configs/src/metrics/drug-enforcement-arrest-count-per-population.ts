import type { MetricConfig } from "../types";

export const drugEnforcementArrestCountPerPopulation: MetricConfig = {
  "key": "drug-enforcement-arrest-count-per-population",
  "title": "覚醒剤取締検挙件数",
  "subtitle": "人口10万人当たり",
  "unit": "件",
  "category": "safetyenvironment",
  "description": "覚醒剤取締検挙件数を総人口で除し、人口10万人当たりに換算した値。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K06503",
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
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "drug-enforcement-arrest-count",
  "seoTitle": "覚醒剤取締検挙件数（人口10万人当たり）ランキング都道府県",
  "seoDescription": "人口10万人当たりの覚醒剤取締検挙件数を都道府県別に比較。総数とは区別して、同じ分母の指標で地域差と経年変化を確認できます。",
  "isActive": true,
};

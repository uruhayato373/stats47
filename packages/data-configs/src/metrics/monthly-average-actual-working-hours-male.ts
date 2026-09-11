import type { MetricConfig } from "../types";

export const monthlyAverageActualWorkingHoursMale: MetricConfig = {
  "key": "monthly-average-actual-working-hours-male",
  "title": "月間平均実労働時間数",
  "subtitle": "男性・1人当たり月間平均",
  "unit": "時間",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F0610103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2024,
    "to": 2024
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
  "seoTitle": "月間平均実労働時間数ランキング都道府県【2024年】｜1位群馬県（180時間）",
  "seoDescription": "2024年の月間平均実労働時間数の都道府県別ランキング。1位群馬県（180時間）、最下位東京都（170時間）で1.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};

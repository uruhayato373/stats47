import type { MetricConfig } from "../types";

export const monthlyAverageActualWorkingHoursFemale: MetricConfig = {
  "key": "monthly-average-actual-working-hours-female",
  "title": "月間平均実労働時間数",
  "subtitle": "女性",
  "unit": "時間",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F0610104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2020,
      2024,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "時間/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "時間/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "月間平均実労働時間数 都道府県ランキング【2024年】｜1位群馬県（169時間）",
  "seoDescription": "2024年の月間平均実労働時間数を都道府県別に比較。1位は群馬県（169時間）、最下位は秋田県（161時間）、最大と最小の差は1.0倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};

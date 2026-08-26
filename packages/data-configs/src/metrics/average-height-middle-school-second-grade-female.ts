import type { MetricConfig } from "../types";

export const averageHeightMiddleSchoolSecondGradeFemale: MetricConfig = {
  "key": "average-height-middle-school-second-grade-female",
  "title": "平均身長",
  "subtitle": "中学2年・女子",
  "unit": "cm",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I0210104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "cm/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "cm/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "平均身長 都道府県ランキング【2023年】｜1位青森県（155.7cm）",
  "seoDescription": "2023年の平均身長を都道府県別に比較。1位は青森県（155.7cm）、最下位は高知県（154.0cm）、最大と最小の差は1.0倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};

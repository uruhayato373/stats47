import type { MetricConfig } from "../types";

export const juniorHighSchoolStudentsCount: MetricConfig = {
  "key": "junior-high-school-students-count",
  "title": "中学校生徒数",
  "subtitle": "総数",
  "unit": "人",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010105",
    "cdCat01": "E3501",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2023,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "calculation": {
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "groupKey": "junior-high-school-students-count",
  "seoTitle": "中学校生徒数ランキング都道府県【2024年】｜1位東京都（313,944人）",
  "seoDescription": "2024年の中学校生徒数の都道府県別ランキング。1位東京都（313,944人）、最下位鳥取県（14,078人）で22.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

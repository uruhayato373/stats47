import type { MetricConfig } from "../types";

export const elementarySchoolChildrenCount: MetricConfig = {
  "key": "elementary-school-children-count",
  "title": "小学校児童数",
  "subtitle": "総数",
  "unit": "人",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010105",
    "cdCat01": "E2501",
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
  "groupKey": "elementary-school-children-count",
  "seoTitle": "小学校児童数ランキング都道府県【2024年】｜1位東京都（620,624人）",
  "seoDescription": "2024年の小学校児童数の都道府県別ランキング。1位東京都（620,624人）、最下位鳥取県（26,620人）で23.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

import type { MetricConfig } from "../types";

export const nursingHomeCapacityPer100065plus: MetricConfig = {
  "key": "nursing-home-capacity-per-1000-65plus",
  "title": "老人ホーム定員数（65歳以上人口千人当たり）",
  "description": "65歳以上人口千人当たりの老人ホーム定員数です。定員の絶対数や入所希望者の充足率ではありません。すでに人口で除した指標のため、追加の人口・面積正規化は行いません。",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J042011",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2008,
      2009,
      2010,
      2011,
      2012,
      2013,
      2014,
      2015,
      2016,
      2017,
      2018,
      2023,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "老人ホーム定員数（65歳以上人口千人当たり）｜都道府県比較",
  "seoDescription": "老人ホーム定員数（65歳以上人口千人当たり）を都道府県別に比較。指標の対象地域・分母・単位・年次を確認し、表とグラフで地域差を把握できます。",
  "isActive": true,
};

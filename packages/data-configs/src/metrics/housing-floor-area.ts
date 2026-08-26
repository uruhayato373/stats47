import type { MetricConfig } from "../types";

export const housingFloorArea: MetricConfig = {
  "key": "housing-floor-area",
  "title": "1住宅当たり延べ面積",
  "description": "住宅・土地統計調査における1住宅当たりの床面積の合計。居住室に加え、玄関、台所、トイレ、浴室、廊下、階段、押入れや住宅内の営業用部分を含む。",
  "note": "別棟の物置・車庫や営業用の附属建物、共同住宅の共用廊下・階段は含まない。2013年・2018年は福島県の一部避難地域が調査対象外。",
  "unit": "m²",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020308",
    "cdCat01": "#H02103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "years": [
      1983,
      1988,
      1993,
      1998,
      2003,
      2008,
      2013,
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "m²/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "m²/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "1住宅当たり延べ面積ランキング市区町村【2023年】｜1位秋田県 美郷町（211.42m²）",
  "seoDescription": "2023年の1住宅当たり延べ面積の市区町村別ランキング。1位秋田県 美郷町（211.42m²）、最下位沖縄県 与那国町（0m²）で地図やグラフで市区町村を比較。",
  "isActive": true,
};

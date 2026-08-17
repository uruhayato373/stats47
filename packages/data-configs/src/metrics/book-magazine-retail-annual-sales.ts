import type { MetricConfig } from "../types";

export const bookMagazineRetailAnnualSales: MetricConfig = {
  "key": "book-magazine-retail-annual-sales",
  "title": "書籍・雑誌小売業年間商品販売額",
  "subtitle": "総額",
  "unit": "円",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010107",
    // e-Stat 原単位 百万円 → config unit 円 の換算 (MONEY-UNIT-SCALE-01)。
    // 宣言しないと 百万円 の値に 円 のラベルが付いたまま配信される。
    "valueScale": 1000000,
    "cdCat01": "G5109",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1975,
      1978,
      1981,
      1984,
      1987,
      1990,
      1993,
      1996,
      2001,
      2006,
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
        "unit": "円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "book-magazine-retail-annual-sales",
  "seoTitle": "書籍・雑誌小売業年間商品販売額ランキング都道府県【2006年】｜1位東京都（5,090億円）",
  "seoDescription": "2006年の書籍・雑誌小売業年間商品販売額の都道府県別ランキング。1位東京都（5,090億円）、最下位鳥取県（89.6億円）で56.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

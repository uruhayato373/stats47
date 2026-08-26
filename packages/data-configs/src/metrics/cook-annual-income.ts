import type { MetricConfig } from "../types";

export const cookAnnualIncome: MetricConfig = {
  "key": "cook-annual-income",
  "title": "飲食物調理従事者の平均年収",
  "description": "賃金構造基本統計調査の一般労働者・男女計の飲食物調理従事者について、6月のきまって支給する現金給与額を12倍し、前年1年間の賞与その他特別給与額を加えた推計年収。",
  "note": "自営業者の所得統計ではなく、雇用される一般労働者の賃金統計。6月の月例給与を年換算した税・社会保険料等控除前の標本平均で、個人の実年収ではない。",
  "unit": "万円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003445758",
    // e-Stat 原単位 千円 → config unit 万円 の換算 (MONEY-UNIT-SCALE-01)。
    // 宣言しないと 千円 の値に 万円 のラベルが付いたまま配信される。
    "valueScale": 0.1,
    "cdCat01": "01",
    "tabCombination": [
      { "cdTab": "08", "factor": 12 },
      { "cdTab": "12", "factor": 1 },
    ],
    "cdCat02": "1391",
    "displayName": "賃金構造基本統計調査",
    "url": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2010,
    "to": 2023,
  },
  "yearFormat": "calendar",
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
        "unit": "万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "飲食物調理従事者の平均年収ランキング都道府県【2023年】｜1位東京都（423.6万円）",
  "seoDescription": "2023年の飲食物調理従事者の平均年収の都道府県別ランキング。1位東京都（423.6万円）、最下位長崎県（273.5万円）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

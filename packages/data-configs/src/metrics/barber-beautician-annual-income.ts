import type { MetricConfig } from "../types";

export const barberBeauticianAnnualIncome: MetricConfig = {
  "key": "barber-beautician-annual-income",
  "title": "理容・美容師の平均年収",
  "description": "賃金構造基本統計調査の一般労働者・男女計の理容・美容師について、6月のきまって支給する現金給与額を12倍し、前年1年間の賞与その他特別給与額を加えた推計年収。",
  "note": "理容師と美容師を合わせた職種区分で、自営業者の所得は対象外。6月の月例給与を年換算した税・社会保険料等控除前の標本平均。",
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
    "cdCat02": "1381",
    "displayName": "賃金構造基本統計調査",
    "url": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
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
  "seoTitle": "理容・美容師の平均年収ランキング都道府県【2023年】｜1位愛知県（451.8万円）",
  "seoDescription": "2023年の理容・美容師の平均年収の都道府県別ランキング。1位愛知県（451.8万円）、最下位鳥取県（227.9万円）で2.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

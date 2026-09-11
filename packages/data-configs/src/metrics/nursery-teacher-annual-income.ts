import type { MetricConfig } from "../types";

export const nurseryTeacherAnnualIncome: MetricConfig = {
  "key": "nursery-teacher-annual-income",
  "title": "保育士の平均年収",
  "description": "賃金構造基本統計調査の保育士について、きまって支給する現金給与額を12倍し年間賞与その他特別給与額を加えた年収換算額です。税・社会保険料を差し引く前の金額で、賞与の対象期間は月額給与の調査時点と異なります。",
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
    "cdCat02": "1163",
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
    "isCalculated": false
  },
  "seoTitle": "保育士の平均年収 都道府県ランキング【2022年】｜1位東京都（450.8万円）",
  "seoDescription": "2022年の保育士の平均年収を都道府県別に比較。1位は東京都（450.8万円）、最下位は山形県（284.2万円）、最大と最小の差は1.6倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};

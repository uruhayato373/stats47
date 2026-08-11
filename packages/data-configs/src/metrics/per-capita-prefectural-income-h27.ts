import type { MetricConfig } from "../types";

export const perCapitaPrefecturalIncomeH27: MetricConfig = {
  "key": "per-capita-prefectural-income-h27",
  "title": "1人当たり県民所得",
  "subtitle": "H27年基準",
  "unit": "千円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C01321",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  // 2026-08-12: 2020 のみだったため、ブログ per-capita-income-gap が引用する 2021年度に
  // SSOT の裏付けが無い状態だった (記事「東京 5,214千円 / 2021年度」に対し R2 は 2020年度の
  // 5,204千円しか持たない)。e-Stat は全年度を返し `years` は絞り込みなので、上端を伸ばしても
  // 上流に 2021 が無ければ何も増えない (推測で値を作らない)。
  "years": {
    "from": 2020,
    "to": 2021,
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
  },
  "seoTitle": "1人当たり県民所得（平成27年基準）",
  "isActive": true,
};

import type { MetricConfig } from "../types";

export const nurseSalary: MetricConfig = {
  "key": "nurse-salary",
  "title": "看護師の所定内給与（月額）",
  "subtitle": "看護師の所定内給与額",
  "description": "賃金構造基本統計調査における看護師の所定内給与額（月額）です。時間外等の超過労働給与額や年間賞与は含まず、年収や手取り額ではありません。",
  "unit": "千円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003445758",
    "cdTab": "10",
    "cdCat01": "01",
    "cdCat02": "1133",
    "displayName": "賃金構造基本統計調査",
    "url": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
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
  "seoTitle": "看護師の所定内給与（月額）｜都道府県比較",
  "seoDescription": "看護師の所定内給与（月額）を都道府県別に比較。指標の対象地域・分母・単位・年次を確認し、表とグラフで地域差を把握できます。",
  "isActive": true,
};

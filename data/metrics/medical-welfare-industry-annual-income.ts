import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const medicalWelfareIndustryAnnualIncome: MetricConfig = {
  "key": "medical-welfare-industry-annual-income",
  "title": "医療・福祉で働く人の平均年収",
  "description": "賃金構造基本統計調査の一般労働者・男女計・年齢計・企業規模計（10人以上）の医療・福祉について、6月のきまって支給する現金給与額を12倍し、前年1年間の賞与その他特別給与額を加えた推計年収。",
  "note": "産業は事業所の主な事業で分類するため、病院・介護施設・保育所などで働く医師・看護師・介護職員・事務職をまとめた平均で、職種ごとの年収ではない。6月の月例給与を年換算した税・社会保険料等控除前の標本平均で、個人の実年収ではない。",
  "unit": "万円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003426933",
    "valueScale": 0.1,
    "cdCat01": "01",
    "cdCat02": "01",
    "cdCat03": "01",
    "cdCat04": "94",
    "tabCombination": [
      {
        "cdTab": "08,40",
        "factor": 12
      },
      {
        "cdTab": "12,44",
        "factor": 1
      }
    ],
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
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};

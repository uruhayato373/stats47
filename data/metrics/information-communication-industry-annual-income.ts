import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const informationCommunicationIndustryAnnualIncome: MetricConfig = {
  "key": "information-communication-industry-annual-income",
  "title": "情報通信業で働く人の平均年収",
  "description": "賃金構造基本統計調査の一般労働者・男女計・年齢計・企業規模計（10人以上）の情報通信業について、6月のきまって支給する現金給与額を12倍し、前年1年間の賞与その他特別給与額を加えた推計年収。",
  "note": "産業は事業所の主な事業で分類するため、情報通信業の事業所で働く事務職や営業職も含み、他の産業で働くシステムエンジニアは含まない。6月の月例給与を年換算した税・社会保険料等控除前の標本平均で、個人の実年収ではない。",
  "unit": "万円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003426933",
    "valueScale": 0.1,
    "cdCat01": "01",
    "cdCat02": "01",
    "cdCat03": "01",
    "cdCat04": "37",
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

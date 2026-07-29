import type { MetricConfig } from "../types";

export const perChildStudentSpecialSupportSchoolExpenditurePrefMunicipal: MetricConfig = {
  "key": "per-child-student-special-support-school-expenditure-pref-municipal",
  "title": "特別支援学校費",
  "subtitle": "都道府県・市町村財政合計",
  "unit": "千円",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0331804",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
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
    "isCalculated": false,
  },
  "groupKey": "special-support-school-expenses-prefecture",
  "seoTitle": "児童・生徒1人当たり特別支援学校費",
  "isActive": true,
};

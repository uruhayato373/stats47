import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const annualPaidLeave11DaysOrMoreRatio: MetricConfig = {
  "key": "annual-paid-leave-11-days-or-more-ratio",
  "title": "年次有給休暇を11日以上取得した雇用者の割合",
  "description": "社会生活基本調査の雇用されている人のうち、年次有給休暇があり過去1年間続けて働いた人（取得日数が0日・1～10日・11～20日・21日以上の計）に占める、11日以上取得した人の割合。",
  "note": "年次有給休暇が無い人と、過去1年間続けて働いていない人は分母に含めない。取得率（付与日数に対する取得日数の割合）ではない。2021年調査で、新型コロナウイルス感染症の流行期間を含む。",
  "unit": "%",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456356",
    "cdTab": "202101A02",
    "cdCat01": "0",
    "cdCat02": "0",
    "cdCat03": "0",
    "axisRatio": {
      "axis": "cat04",
      "numeratorCodes": ["13", "14"],
      "denominatorCodes": ["11", "12", "13", "14"],
    },
    "displayName": "社会生活基本調査",
    "url": "https://www.stat.go.jp/data/shakai/2021/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2021,
    "to": 2021,
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
    // 取り込み時に axisRatio (cat04: 11～20日・21日以上 / 0日～21日以上の計) で確定する
    "isCalculated": false,
  },
  "isActive": true,
};

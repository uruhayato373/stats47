import type { MetricConfig } from "../types";

export const localGovernmentFinalConsumptionExpenditureNominalH27: MetricConfig = {
  "key": "local-government-final-consumption-expenditure-nominal-h27",
  "title": "地方政府等最終消費支出",
  "subtitle": "名目（H27年基準）",
  "unit": "百万円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C1322",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
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
  "seoTitle": "地方政府等最終消費支出（名目）（平成27年基準）",
  "isActive": false,
};

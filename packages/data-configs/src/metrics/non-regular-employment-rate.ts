import type { MetricConfig } from "../types";

export const nonRegularEmploymentRate: MetricConfig = {
  "key": "non-regular-employment-rate",
  "title": "非正規雇用率",
  "unit": "%",
  "category": "labor",
  "source": {
    "kind": "estat",
    "statsDataId": "0004008452",
    "cdCat01": "0",
    "cdCat02": "00",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "calendar",
  "calculation": {
    "isCalculated": true,
    "type": "ratio",
    "formula": "cat04_322 / (cat04_321 + cat04_322)",
    "description": "非正規の職員・従業員数 ÷ (正規+非正規の職員・従業員数)",
  },
  "seoTitle": "非正規雇用率ランキング都道府県【2022年】｜1位京都府（40.7%）",
  "seoDescription": "2022年の非正規雇用率の都道府県別ランキング。1位京都府（40.7%）、最下位富山県（32.32%）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

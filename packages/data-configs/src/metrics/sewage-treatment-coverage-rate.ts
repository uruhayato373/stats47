import type { MetricConfig } from "../types";

export const sewageTreatmentCoverageRate: MetricConfig = {
  "key": "sewage-treatment-coverage-rate",
  "title": "汚水処理人口普及率",
  "unit": "％",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H5410",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "汚水処理人口普及率ランキング都道府県【2023年】｜1位東京都（99.9％）",
  "seoDescription": "2023年の汚水処理人口普及率の都道府県別ランキング。1位東京都（99.9％）、最下位徳島県（68.5％）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

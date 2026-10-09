import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const workersCompensationInsuranceBenefitsRate: MetricConfig = {
  "key": "workers-compensation-insurance-benefits-rate",
  "title": "労働者災害補償保険給付率",
  "unit": "％",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F08101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "労働者災害補償保険給付率ランキング都道府県【2023年】｜1位高知県（14.3％）",
  "seoDescription": "2023年の労働者災害補償保険給付率の都道府県別ランキング。1位高知県（14.3％）、最下位東京都（3％）で4.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

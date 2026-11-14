import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const fireDepartmentBranchCountPer100Km2: MetricConfig = {
  "key": "fire-department-branch-count-per-100-km2",
  "title": "消防団・分団数",
  "subtitle": "可住地面積100km2当たり",
  "unit": "団",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K01104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "yearFormat": "fiscal",
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
  "seoTitle": "消防団・分団数ランキング都道府県【2024年】｜1位東京都（57.3団）",
  "seoDescription": "2024年の消防団・分団数の都道府県別ランキング。1位東京都（57.3団）、最下位北海道（5.5団）で10.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

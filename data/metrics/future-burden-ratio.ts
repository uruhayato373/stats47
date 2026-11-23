import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const futureBurdenRatio: MetricConfig = {
  "key": "future-burden-ratio",
  "title": "将来負担比率",
  "subtitle": "都道府県財政",
  "description": "公営企業、地方公社、損失補償を行う出資法人等を含め、一般会計等が将来負担すべき実質的な負債が、標準財政規模を基本とした額に占める割合。",
  "note": "将来負担額から財政調整基金などの充当可能財源等を控除し、分母の標準財政規模からも元利償還金等に係る基準財政需要額算入額を控除して算定する。",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D2112",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2011,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "isActive": true
};

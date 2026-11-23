import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const realPublicDebtServiceRatio: MetricConfig = {
  "key": "real-public-debt-service-ratio",
  "title": "実質公債費比率",
  "subtitle": "都道府県財政",
  "description": "一般会計等が負担する元利償還金と、公営企業債の償還金への繰出金など準元利償還金を含む実質的な公債費相当額が、標準財政規模を基本とした額に占める割合の過去3年間平均。",
  "note": "分子から特定財源と基準財政需要額算入額を、分母の標準財政規模からも元利償還金等に係る基準財政需要額算入額を控除して算定する。単年度の公債費割合ではない。",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D2111",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2008,
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

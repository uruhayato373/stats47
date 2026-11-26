import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const perCapitaTotalExpenditurePrefMunicipal: MetricConfig = {
  "key": "per-capita-total-expenditure-pref-municipal",
  "title": "歳出決算総額",
  "subtitle": "都道府県・市町村財政合計・人口1人当たり",
  "denominator": { "kind": "population", "per": 1 },
  "description": "都道府県と市町村の1会計年度における歳出決算総額を合計し、総人口で割った人口1人当たりの支出額。",
  "note": "行政目的別・経費性質別の各支出を含む財政規模の指標であり、住民個人が受け取った給付額や行政サービスの質を示すものではない。",
  "unit": "千円",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0330103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1975,
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
  "groupKey": "total-expenditure-prefecture",
  "isActive": true
};

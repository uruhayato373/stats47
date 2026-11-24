import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const publicWorksExpenditureRatioPrefFinance: MetricConfig = {
  "key": "public-works-expenditure-ratio-pref-finance",
  "title": "土木費割合",
  "subtitle": "都道府県財政",
  "description": "都道府県が道路、河川、公園、住宅等の公共施設の建設・整備・維持管理に支出した土木費を、歳出決算総額で割り、100倍した割合。",
  "note": "都道府県財政だけの目的別歳出構成比で、市町村の土木費は含まない。公共施設の整備量や住民1人当たり支出額を示す指標ではない。",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0311201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};

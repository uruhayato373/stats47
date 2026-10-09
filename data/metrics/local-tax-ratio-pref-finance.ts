import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const localTaxRatioPrefFinance: MetricConfig = {
  "key": "local-tax-ratio-pref-finance",
  "title": "地方税割合",
  "subtitle": "都道府県財政",
  "description": "都道府県財政の地方税収入を、歳入決算総額で割り、100倍した割合。",
  "note": "歳入のうち地方税が占める構成比であり、税収額そのものや住民1人当たりの税負担を示す指標ではない。",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0210101",
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
  "seoTitle": "地方税割合ランキング都道府県【2022年】｜1位東京都（63.42％）",
  "seoDescription": "2022年の地方税割合の都道府県別ランキング。1位東京都（63.42％）、最下位島根県（15.46％）で4.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

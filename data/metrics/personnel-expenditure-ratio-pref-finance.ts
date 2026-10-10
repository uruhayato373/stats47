import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const personnelExpenditureRatioPrefFinance: MetricConfig = {
  "key": "personnel-expenditure-ratio-pref-finance",
  "title": "人件費割合",
  "subtitle": "都道府県財政",
  "description": "都道府県財政の性質別歳出における人件費を、歳出決算総額で割り、100倍した割合。",
  "note": "歳出に占める人件費の構成比であり、職員1人当たりの給与額や職員数を示す指標ではない。",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0320101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1976,
    "to": 2022,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
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
  "seoTitle": "人件費割合ランキング都道府県【2022年】｜1位三重県（25.5％）",
  "seoDescription": "2022年の人件費割合の都道府県別ランキング。1位三重県（25.5％）、最下位東京都（16.95％）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

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
    "from": 1977,
    "to": 2022,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
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
  "seoTitle": "土木費割合ランキング都道府県【2022年】｜1位福島県（18.56％）",
  "seoDescription": "2022年の土木費割合の都道府県別ランキング。1位福島県（18.56％）、最下位神奈川県（4.48％）で4.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

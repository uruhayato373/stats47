import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const welfareExpenditureRatioPrefFinance: MetricConfig = {
  "key": "welfare-expenditure-ratio-pref-finance",
  "title": "民生費割合",
  "subtitle": "都道府県財政",
  "description": "都道府県が児童、高齢者、心身障害者等の福祉施設の整備・運営、生活保護、災害救助などに支出した民生費を、歳出決算総額で割り、100倍した割合。",
  "note": "都道府県財政だけの目的別歳出構成比で、市町村の民生費は含まない。民生費の金額や住民1人当たり支出額を示す指標ではない。",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0310301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1981,
    "to": 2022,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
        1979,
        1980,
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
  "seoTitle": "民生費割合ランキング都道府県【2022年】｜1位神奈川県（21.77％）",
  "seoDescription": "2022年の民生費割合の都道府県別ランキング。1位神奈川県（21.77％）、最下位島根県（10.81％）で2.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

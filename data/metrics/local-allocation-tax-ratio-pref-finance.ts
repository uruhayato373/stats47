import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const localAllocationTaxRatioPrefFinance: MetricConfig = {
  "key": "local-allocation-tax-ratio-pref-finance",
  "title": "地方交付税割合",
  "subtitle": "都道府県財政",
  "description": "都道府県財政の地方交付税収入を、歳入決算総額で割り、100倍した割合。",
  "note": "歳入に占める地方交付税の構成比を示す。割合が低くても、地方税など他の歳入構成や歳入総額を併せて見なければ財政力の高低は判断できない。",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0210201",
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
  "seoTitle": "地方交付税割合ランキング都道府県【2022年】｜1位高知県（37.42％）",
  "seoDescription": "2022年の地方交付税割合の都道府県別ランキング。1位高知県（37.42％）、最下位東京都（0％）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};

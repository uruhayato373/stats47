import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const perCapitaTotalExpenditurePrefMunicipal: MetricConfig = {
  "key": "per-capita-total-expenditure-pref-municipal",
  "title": "歳出決算総額",
  "subtitle": "都道府県・市町村財政合計（人口1人当たり）",
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
    "from": 1994,
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
        1981,
        1982,
        1983,
        1984,
        1985,
        1986,
        1987,
        1988,
        1989,
        1990,
        1991,
        1992,
        1993,
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
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "groupKey": "total-expenditure-prefecture",
  "seoTitle": "歳出決算総額ランキング都道府県【2022年】｜1位島根県（1,597.6千円）",
  "seoDescription": "2022年の歳出決算総額の都道府県別ランキング。1位島根県（1,597.6千円）、最下位埼玉県（718.7千円）で2.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};

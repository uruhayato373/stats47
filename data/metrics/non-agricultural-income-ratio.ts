import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const nonAgriculturalIncomeRatio: MetricConfig = {
  "key": "non-agricultural-income-ratio",
  "title": "農外所得割合",
  "description": "農家の所得に占める農外所得 (農外収入から農外支出を差し引いた額) の割合。社会・人口統計体系の指標で、元データは農林水産省「農業経営統計調査」。",
  "note": "分母は農家総所得 (農業所得＋農外所得＋年金・被贈等の収入) と読めるが、指標の算式は e-Stat で確認できていない。農業所得割合と農外所得割合を足しても 100％ にならない (残りは年金・被贈等の収入と考えられる)。基礎データは 2003 年で収集が中止されている。出典: e-Stat「統計項目の定義 L 家計」https://www.e-stat.go.jp/koumoku/koumoku_teigi/L (2026-10-21 確認)",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L0110102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2001,
    "to": 2003,
  },
  "yearExclusions": [
    {
      "years": [
        1985,
        1990,
        1995,
        1996,
        1997,
        1998,
        1999,
        2000,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "農外所得割合ランキング都道府県【2003年】｜1位東京都（79.8％）",
  "seoDescription": "2003年の農外所得割合の都道府県別ランキング。1位東京都（79.8％）、最下位北海道（15.1％）で5.3倍の格差。地図やグラフで47都道府県を比較。",
  "surveyId": "agriculture-management-survey",
  "isActive": true,
};

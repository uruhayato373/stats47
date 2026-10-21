import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const totalFarmHouseholdIncome: MetricConfig = {
  "key": "total-farm-household-income",
  "title": "農家総所得",
  "description": "農業所得 (農業粗収益−農業経営費) と農外所得 (農外収入−農外支出) に、年金・被贈等の収入を加えた所得。農林水産省「農業経営統計調査」の値で、e-Stat の項目定義どおり。",
  "note": "調査対象の農家 1 戸当たりの平均と読める値 (数百万〜千数百万円) だが、e-Stat の項目定義に 1 戸当たりの明記は無い。基礎データは 1975〜2003 年で収集が中止されている。出典: e-Stat「統計項目の定義 L 家計」https://www.e-stat.go.jp/koumoku/koumoku_teigi/L (2026-10-21 確認)",
  "unit": "千円",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L01100",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1995,
    "to": 2003,
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
        1994,
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    // 1 戸当たりの所得なので人口・面積当たりへの換算は意味が無い (METRIC-FARM-INCOME-DEFS-01)
    "normalizationOptions": [],
  },
  "seoTitle": "農家総所得ランキング都道府県【2003年】｜1位大阪府（12,836千円）",
  "seoDescription": "2003年の農家総所得の都道府県別ランキング。1位大阪府（12,836千円）、最下位沖縄県（4,457千円）で2.9倍の格差。地図やグラフで47都道府県を比較。",
  "surveyId": "agriculture-management-survey",
  "isActive": true,
};

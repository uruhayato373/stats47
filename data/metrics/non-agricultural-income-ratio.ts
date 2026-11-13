import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const nonAgriculturalIncomeRatio: MetricConfig = {
  "key": "non-agricultural-income-ratio",
  "title": "農外所得割合",
  "description": "農家の所得に占める農外所得 (農外収入から農外支出を差し引いた額) の割合。社会・人口統計体系の指標で、元データは農林水産省「農業経営統計調査」。",
  "note": "分母は農家総所得 (農業所得＋農外所得＋年金・被贈等の収入)。e-Stat の指標計算式は「農外所得／農家総所得」(L210102/L2100) で、定義は「農家総所得とは農業所得と農外所得に年金・被贈等の収入を加算したもの」。農業所得割合と農外所得割合を足して 100％ にならないのは、残りが年金・被贈等の収入の割合に当たるため (算式から導いた説明で、県別の数値の突合は未実施)。年の区切りは、農林水産省の現行の概要が調査期間を当年 1 月から 12 月と書き (https://www.maff.go.jp/j/tokei/kouhyou/noukei/einou_kobetu/gaiyou/index.html)、一橋大学経済研究所の資料が 1995 年 (平成 7 年) に年度から暦年へ変わったと書くので (https://d-infra.ier.hit-u.ac.jp/Japanese/census-survey/b011.html)、表示する 1995〜2003 年は暦年。1994 年以前は農家経済調査の年度と読め、同じ系列に年度と暦年が混ざる (1994 年以前の区切りは農林水産省の資料では未確認で、yearFormat は暦年に合わせた)。基礎データは 2003 年で収集が中止されている。出典: e-Stat「統計項目の定義 L 家計」https://www.e-stat.go.jp/koumoku/koumoku_teigi/L・「指標計算式 L」https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/L (いずれも 2026-11-14 確認)",
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
    "years": [
      1985,
      1990,
      1995,
      1996,
      1997,
      1998,
      1999,
      2000,
      2001,
      2002,
      2003,
    ],
  },
  "yearFormat": "calendar",
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

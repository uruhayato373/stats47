import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const totalFarmHouseholdIncome: MetricConfig = {
  "key": "total-farm-household-income",
  "title": "農家総所得",
  "subtitle": "調査対象の農家1戸当たりの平均",
  "description": "農業所得 (農業粗収益−農業経営費) と農外所得 (農外収入−農外支出) に、年金・被贈等の収入を加えた所得。農林水産省「農業経営統計調査」の値で、e-Stat の項目定義どおり。",
  "note": "農家 1 戸当たりの平均と読める値 (数百万〜千数百万円) だが、e-Stat の項目定義 (L2100) に 1 戸当たりの明記は無く、2003 年当時の調査単位が農家か経営体かは未確認 (農林水産省の現行の概要は 1 経営体当たりの平均値)。年の区切りは、農林水産省の現行の概要が調査期間を当年 1 月から 12 月と書き (https://www.maff.go.jp/j/tokei/kouhyou/noukei/einou_kobetu/gaiyou/index.html)、一橋大学経済研究所の資料が 1995 年 (平成 7 年) に年度から暦年へ変わったと書くので (https://d-infra.ier.hit-u.ac.jp/Japanese/census-survey/b011.html)、表示する 1995〜2003 年は暦年。1994 年以前は農家経済調査の年度と読め、同じ系列に年度と暦年が混ざる (1994 年以前の区切りは農林水産省の資料では未確認で、yearFormat は暦年に合わせた)。基礎データは 2003 年で収集が中止されている。出典: e-Stat「統計項目の定義 L 家計」https://www.e-stat.go.jp/koumoku/koumoku_teigi/L・「指標計算式 L」https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/L (いずれも 2026-11-14 確認)",
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
    "from": 1975,
    "to": 2003,
  },
  "yearFormat": "calendar",
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
    // 1 戸当たりの所得なので人口・面積当たりへの換算は意味が無い (METRIC-HOUSEHOLD-ASSET-SUBTITLE-01)
    "normalizationOptions": [],
  },
  "seoTitle": "農家総所得ランキング都道府県【2003年】｜1位大阪府（12,836千円）",
  "seoDescription": "2003年の農家総所得の都道府県別ランキング。1位大阪府（12,836千円）、最下位沖縄県（4,457千円）で2.9倍の格差。地図やグラフで47都道府県を比較。",
  "surveyId": "agriculture-management-survey",
  "isActive": true,
};

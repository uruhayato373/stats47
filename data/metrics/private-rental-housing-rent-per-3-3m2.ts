import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const privateRentalHousingRentPer33m2: MetricConfig = {
  "key": "private-rental-housing-rent-per-3-3m2",
  "title": "民営家賃（3.3m²当たり月額）",
  "description": "県庁所在市等で調査した民営借家の3.3m²当たり1か月の家賃です。都道府県全域の平均家賃や世帯が実際に支払った住居費とは対象が異なります。",
  "note": "小売物価統計調査の「3.3㎡当たり家賃(民営)」の年平均価格(月額)。同調査の家賃調査区にある民営借家の世帯の月別平均価格を単純算術平均したもので、e-Statの項目定義は収集対象を「県庁所在都市」と書く。東京都の対象範囲(区部か都全域か)は項目定義に明記がなく未確認。2008年は家賃調査地区の抽出替えのため3〜12月で計算している。出典: e-Stat「統計項目の定義 H 居住」の項目 H410302 https://www.e-stat.go.jp/koumoku/koumoku_teigi/H (2026-11-14 確認)",
  "unit": "円",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H04102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "民営家賃（3.3m²当たり月額）｜都道府県比較",
  "seoDescription": "民営家賃（3.3m²当たり月額）を都道府県別に比較。指標の対象地域・分母・単位・年次を確認し、表とグラフで地域差を把握できます。",
  "isActive": true,
};

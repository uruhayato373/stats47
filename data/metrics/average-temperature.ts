import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const averageTemperature: MetricConfig = {
  "key": "average-temperature",
  "title": "年平均気温",
  "description": "1日24回の観測値から日平均気温を、その月平均を、12か月分の月平均の算術平均を年平均気温とした値。観測地点は都道府県庁所在地の気象台で、埼玉県は熊谷市、東京都は千代田区、滋賀県は彦根市の観測値を使う。県全体の平均ではなく、その地点の値である。出典は気象庁の「過去の気象データ」(e-Stat「統計項目の定義 B 自然環境」の項目 B4101、2026-11-14 確認)。",
  "unit": "℃",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010102",
    "cdCat01": "B4101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1975,
    "to": 2024
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "年平均気温ランキング都道府県【2024年】｜1位沖縄県（24.4℃）",
  "seoDescription": "2024年の年平均気温の都道府県別ランキング。1位沖縄県（24.4℃）、最下位北海道（10.5℃）で2.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};

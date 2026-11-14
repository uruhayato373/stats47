import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const annualSunshineDuration: MetricConfig = {
  "key": "annual-sunshine-duration",
  "title": "年間日照時間",
  "description": "直射日光が地表を照射した時間の年間の合計。観測地点は都道府県庁所在地の気象台で、埼玉県は熊谷市、東京都は千代田区、滋賀県は彦根市の観測値を使う。県全体の平均ではなく、その地点の値である。出典は気象庁の「過去の気象データ」。",
  "unit": "時間",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010102",
    "cdCat01": "B4108",
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
  "seoTitle": "年間日照時間ランキング都道府県【2024年】｜1位高知県（2,309時間）",
  "seoDescription": "2024年の年間日照時間の都道府県別ランキング。1位高知県（2,309時間）、最下位山形県（1,625.6時間）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};

import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const perCapitaWelfareExpenditurePrefMunicipal: MetricConfig = {
  "key": "per-capita-welfare-expenditure-pref-municipal",
  "title": "民生費",
  "subtitle": "都道府県・市町村財政合計",
  "unit": "千円",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0330203",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "千円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "千円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "welfare-expenses-prefecture",
  "seoTitle": "民生費ランキング都道府県【2022年】｜1位沖縄県（371.4千円）",
  "seoDescription": "2022年の民生費の都道府県別ランキング。1位沖縄県（371.4千円）、最下位静岡県（216.2千円）で1.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

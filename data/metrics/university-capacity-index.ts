import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const universityCapacityIndex: MetricConfig = {
  "key": "university-capacity-index",
  "title": "大学収容力指数",
  "description": "社会・人口統計体系（統計局）の指標で、大学入学者数に100を掛け、前年度の高等学校卒業者のうち大学進学者数で割った値（算式は E6403/E460220[-1]）。2000年度から分母に中等教育学校後期課程の卒業者のうち大学進学者数を、2008年度から特別支援学校（高等部）の卒業者のうち大学進学者数を加える。分母は前年度の卒業者なので、同じ年度の進学率とは別の量で、全国を100とする指数でもない。",
  "unit": "指数",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0610202",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1976,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 100,
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "大学収容力指数ランキング都道府県【2024年】｜1位京都府（238.3）",
  "seoDescription": "2024年の大学収容力指数の都道府県別ランキング。1位京都府（238.3）、最下位三重県（46.7）で5.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const informationPrivateEstablishments: MetricConfig = {
  "key": "information-private-establishments",
  "title": "情報通信業事業所数（民営）",
  "description": "経済センサスの民営事業所のうち、情報通信業に分類される事業所の数。事業所が所在する都道府県ごとに集計する。",
  "note": "2021年6月1日現在。2021年調査は法人番号を用いて調査対象名簿を拡充したため、過去の調査との増減を単純比較しない。企業の本社所在地別の集計ではない。",
  "unit": "事業所",
  "category": "ict",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C210839",
    "displayName": "社会・人口統計体系（原典：経済センサス‐活動調査）",
    "url": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "years": [
      2011,
      2014,
      2016,
      2021,
    ],
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "isActive": true
};

import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const manufacturingShipmentAmountPerEmployee: MetricConfig = {
  "key": "manufacturing-shipment-amount-per-employee",
  "title": "製造品出荷額等",
  "subtitle": "従業者1人当たり",
  "description": "製造品出荷額等を製造業従業者数で割った、従業者1人当たりの出荷額等。",
  "note": "出荷額等には加工賃、くず廃物、その他収入や内国消費税等を含むため、従業者1人当たりの賃金や付加価値額を示す指標ではない。調査変更をまたぐ時系列比較には注意が必要。",
  "unit": "万円",
  "category": "miningindustry",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C04401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1992,
    "to": 2023,
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
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "groupKey": "manufacturing-shipment-amount",
  "seoTitle": "製造品出荷額等ランキング都道府県【2023年】｜1位大分県（8,547.4万円）",
  "seoDescription": "2023年の製造品出荷額等の都道府県別ランキング。1位大分県（8,547.4万円）、最下位沖縄県（2,166.9万円）で3.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};

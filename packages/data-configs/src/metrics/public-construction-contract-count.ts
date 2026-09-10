import type { MetricConfig } from '../types';

export const publicConstructionContractCount: MetricConfig = {
  "key": "public-construction-contract-count",
  "title": "公共工事の請負契約件数",
  "subtitle": "施工都道府県別・1件500万円以上",
  "description": "建設工事受注動態統計調査の公共機関から受注した1件500万円以上の工事について、施工都道府県別に集計した年度計です。",
  "note": "建設業者の所在地別の完成工事高とは地域帰属・時点が異なります。小額工事や民間受注を含む公共投資総額ではありません。",
  "unit": "件",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3307",
    "displayName": "社会・人口統計体系（原典：建設工事受注動態統計調査）",
    "url": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2014,
    "to": 2024
  },
  "yearFormat": "fiscal",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "calculation": {
    "isCalculated": false
  },
  "isActive": true
};

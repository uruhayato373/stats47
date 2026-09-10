import type { MetricConfig } from "../types";

export const childRearingAllowanceRecipients: MetricConfig = {
  "key": "child-rearing-allowance-recipients",
  "title": "児童扶養手当受給者数",
  "description": "児童扶養手当法に基づく児童扶養手当の年度末現在受給者数。",
  "note": "2023年度末（2024年3月31日）。受給者である母・父・養育者等の人数であり、対象児童数や母子世帯数ではない。子供の条件や所得制限等を満たす対象者への給付で、すべてのひとり親世帯が対象ではない。全国と47県のSSDS行政値を使用し、受給率の分母へ別調査世帯数を使わない。",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010110",
    "cdTab": "00001",
    "cdCat01": "J1401",
    "displayName": "社会・人口統計体系（原典：福祉行政報告例）",
    "url": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/J"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2023,
    "to": 2023
  },
  "yearFormat": "fiscal",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "isActive": true
};

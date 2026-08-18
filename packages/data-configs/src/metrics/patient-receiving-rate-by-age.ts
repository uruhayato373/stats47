import type { MetricConfig } from "../types";

export const patientReceivingRateByAge: MetricConfig = {
  "key": "patient-receiving-rate-by-age",
  "title": "受療率（性年齢別総数・入院総数）（患者調査）",
  "subtitle": "性年齢別集計",
  "unit": "人口10万対",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026104",
    "cdCat01": "1",
    "cdCat02": "1",
    "cdCat04": "1",
    "areaAxis": {
      "axis": "cat03",
      "scheme": "seq-pref",
    },
    "displayName": "受療率（性年齢別総数・入院総数）（2023年患者調査）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004026104",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  // 2026-07-30: areaAxis 是正で 47 県そろったが、入院受療率 (inpatient-rate-per-100k) と同一表・同一 pin で値が完全一致するため 非公開にする。
  // 未公開 (KNOWN_RANKING_KEYS 外) だったため失う流入は無い。
  // 独自の内訳 (65歳以上 / 主要傷病 / 一般病床 等) を pin して別 metric として
  // 再定義するなら title・SEO も含めて仕様から起こす → .claude/todo/backlog.md
  "isActive": false,
};

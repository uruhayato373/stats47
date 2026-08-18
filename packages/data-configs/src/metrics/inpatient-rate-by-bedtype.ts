import type { MetricConfig } from "../types";

export const inpatientRateByBedtype: MetricConfig = {
  "key": "inpatient-rate-by-bedtype",
  "title": "入院受療率（病床総数）（患者調査）",
  "subtitle": "病床別",
  "unit": "人口10万対",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004002555",
    "cdCat01": "1",
    "cdCat02": "1",
    "cdCat04": "01",
    "areaAxis": {
      "axis": "cat03",
      "scheme": "seq-pref",
    },
    "displayName": "入院受療率（病床総数）（2020年患者調査）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004002555",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
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
  // 2026-07-30: areaAxis 是正で 47 県そろったが、病床「総数」の入院受療率 = 入院受療率の別年版と同値のため 非公開にする。
  // 未公開 (KNOWN_RANKING_KEYS 外) だったため失う流入は無い。
  // 独自の内訳 (65歳以上 / 主要傷病 / 一般病床 等) を pin して別 metric として
  // 再定義するなら title・SEO も含めて仕様から起こす → .claude/todo/06_指標バックログ.md
  "isActive": false,
};

import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const dentalClinicCount: MetricConfig = {
  "key": "dental-clinic-count",
  "title": "歯科診療所数",
  "subtitle": "総数",
  "unit": "施設",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010109",
    "cdCat01": "I5103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "supplementalSources": [
    {
      "years": [2024],
      "source": {
        "kind": "estat",
        "statsDataId": "0004048426",
        "cdCat02": "100",
        "cdCat03": "1",
        "areaAxis": { "axis": "cat01", "scheme": "name" },
        "displayName": "医療施設調査",
        "url": "https://www.mhlw.go.jp/toukei/list/79-1.html",
      },
      "reason": "社会・人口統計体系 (0000010109) は医療施設調査の項目が 2023 年で止まるため、原典の医療施設 (静態・動態) 調査の 2024 年の第27表 歯科診療所数 (都道府県・開設者・病床の有無別)から取る。開設者は総数。都道府県が分類軸にあるので areaAxis で県に写す。2023 年版の同じ表 (2024 年は 0004048426、2023 年は同名の表) の 47 都道府県の値が SSDS の 2023 年の値とすべて一致することを 2026-11-23 に確かめた (DATA-MEDICAL-FACILITY-SOURCE-01)",
    },
  ],
  "yearFormat": "calendar",
  "calculation": {
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "施設/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "施設/100km²",
        "decimalPlaces": 2,
      },
      {
        "type": "series",
        "metric": "dental-clinic-count-per-100km2",
      },
    ],
    "isCalculated": false,
  },
  "groupKey": "dental-clinic-count",
  "isActive": true,
};

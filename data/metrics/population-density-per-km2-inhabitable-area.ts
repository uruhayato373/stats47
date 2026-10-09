import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const populationDensityPerKm2InhabitableArea: MetricConfig = {
  "key": "population-density-per-km2-inhabitable-area",
  "title": "可住地面積１km2当たり人口密度",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A01202",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture",
    "city"
  ],
  "years": {
    "years": [
      1985,
      1990,
      1995,
      2000,
      2005,
      2010,
      2015,
      2020,
      2023,
      2024,
    ],
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
        1986,
        1987,
        1988,
        1989,
        1991,
        1992,
        1993,
        1994,
        1996,
        1997,
        1998,
        1999,
        2001,
        2002,
        2003,
        2004,
        2006,
        2007,
        2008,
        2009,
        2011,
        2012,
        2013,
        2014,
        2016,
        2017,
        2018,
        2019,
        2021,
        2022,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "calendar",
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
  "isActive": true,
  "subtitle": "可住地1km²当たり"
};

import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const agriculturalOutputPerEmployedPerson: MetricConfig = {
  "key": "agricultural-output-per-employed-person",
  "title": "就業者1人当たり農業産出額",
  "subtitle": "農業就業者",
  "unit": "万円",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C0410101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1989,
      1994,
      1999,
      2000,
      2001,
      2002,
      2003,
      2004,
      2005,
      2006,
      2007,
      2008,
      2009,
      2010,
      2011,
      2012,
      2013,
      2014,
      2015,
      2016,
      2017,
      2018,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "就業者1人当たり農業産出額（販売農家）",
  "isActive": true,
};

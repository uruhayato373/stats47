import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const perCapitaInhabitantTaxPrefMunicipal: MetricConfig = {
  "key": "per-capita-inhabitant-tax-pref-municipal",
  "title": "住民税",
  "subtitle": "都道府県・市町村財政合計・人口1人当たり",
  "denominator": { "kind": "population", "per": 1 },
  "description": "都道府県民税と市町村民税の収入額を合計し、総人口で割った人口1人当たりの住民税額。",
  "note": "住民税には個人住民税と法人住民税を含むため、個人が実際に負担する平均税額ではない。都道府県・市町村財政の合計を総人口で均した値。",
  "unit": "千円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0220103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1975,
    "to": 2022,
  },
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
  "isActive": true
};

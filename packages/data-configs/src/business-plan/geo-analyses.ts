import { SNOW_DESIGNATION_ANALYSIS } from './snow-designation-analysis';
import { LANDSLIDE_EXPOSURE_ANALYSIS } from './landslide-exposure-analysis';
import { BUSINESS_PLAN_M1_GEO_ANALYSES } from './m1';
import type { BusinessPlanM1Analysis } from './types';

/** Site analyses include theme extensions; the M1 publication campaign keeps its own scope. */
export const GEO_ANALYSES = [
  ...BUSINESS_PLAN_M1_GEO_ANALYSES,
  SNOW_DESIGNATION_ANALYSIS,
  LANDSLIDE_EXPOSURE_ANALYSIS,
{
  "id": "m1-analysis-population-public-facility-access",
  "contentId": "geo-128",
  "slug": "population-public-facility-access",
  "title": "行政施設・公的集会施設までの距離と地域人口",
  "question": "市町村役場等と公的集会施設への距離帯ごとに、2020年人口と2050年推計人口はどう分布するか",
  "analysisKind": "spatial-cross",
  "sourceLayers": [
    {
      "id": "ipss-population-mesh-1km",
      "label": "1km将来人口メッシュ",
      "geometry": "mesh",
      "role": "calculation-input",
      "usedInCalculation": true
    },
    {
      "id": "ksj-p05-public-facility-point",
      "label": "市町村役場等・公的集会施設の原典地点",
      "geometry": "point",
      "role": "calculation-input",
      "usedInCalculation": true
    }
  ],
  "spatialOperations": [
    "全国2施設群の最近隣検索とメッシュ中心からの大円距離",
    "5距離帯へ排他的に分類し、2人口年と2施設群を独立集計"
  ],
  "primaryMetricKey": "administrativeWithin1000mShare2020",
  "metricKeys": [
    "administrativeWithin1000mShare2020",
    "administrativeWithin1000mShare2050",
    "meetingWithin1000mShare2020",
    "meetingWithin1000mShare2050",
    "population2020",
    "population2050"
  ],
  "r2Key": "app/geo/population-public-facility-access/item.json",
  "evidenceManifestKey": "app/geo/population-public-facility-access/manifest.json",
  "detailR2KeyPattern": "app/geo/population-public-facility-access/pref/{NN}.json",
  "status": "ready",
  "geography": "prefecture",
  "comparisonLimit": 3,
  "expectedObservationCount": 47,
  "dataVersion": "P05-22_population2020-2050_mesh1000r6-24",
  "evidenceCheckedAt": "2026-09-10",
  "sourceName": "国土交通省「市町村役場等・公的集会施設」・1kmメッシュ別将来推計人口",
  "sourceUrl": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P05-v3_0.html",
  "caveats": [
    "2022年4月の施設位置を固定し、2020年人口と2050年推計人口を比較する",
    "1kmメッシュ中心からの大円距離で、500m帯は粗い近似。道路距離や徒歩時間ではない",
    "県外最寄りを含み、行政窓口の利用資格・開館時間・将来の施設存続を判定しない",
    "2施設群は同じ人口を別々に分類し、両群の人口を合算しない"
  ]
},
] as const satisfies readonly BusinessPlanM1Analysis[];

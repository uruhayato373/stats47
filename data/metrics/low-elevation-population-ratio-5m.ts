import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const lowElevationPopulationRatio5m: MetricConfig = {
  "key": "low-elevation-population-ratio-5m",
  "title": "平均標高5m以下の地域に住む人口の割合",
  "subtitle": "1kmメッシュの平均標高が5m以下のメッシュの人口 / 都道府県人口",
  "note": "標高は2009年時点の約1km単位の平均値で、海抜の低い狭い土地の判定には粗い。0m以下・10m以下の値と、メッシュ内の最低標高で分けた上限側の値は /geo/population-low-elevation の県別データに並べて保存している。浸水・高潮・津波が起きることを示す値ではない。",
  "description": "国土数値情報の標高・傾斜度3次メッシュ（2011年度版）の平均標高が5m以下の1kmメッシュに住む人口を、同じ1kmメッシュの2020年人口（令和2年国勢調査）から合計し、都道府県人口で割った割合。5mに全国共通の公的な基準は確認できないため、0m・10mのしきい値も同じ手順で集計している。",
  "unit": "%",
  "category": "landweather",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "国土数値情報 標高・傾斜度3次メッシュ（G04-a, 2011年度版）× 1kmメッシュ別将来推計人口（mesh1000r6, R6国政局推計の2020年人口）",
        "url": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-G04-a.html",
        "license": "G04-a: 商用可（原典表示あり） / mesh1000r6: CC BY 4.0",
      },
      "description": "標高3次メッシュの平均標高（G04a_002）が5m以下の3次メッシュコードに一致する1kmメッシュ人口（PTN_2020）を県別に合計し、県の1kmメッシュ人口合計で割る",
      "provenance": {
        "publicationIndexUrl": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-mesh1000r6.html",
        "url": "https://nlftp.mlit.go.jp/ksj/gml/data/m1kr6/m1kr6-24/1km_mesh_2024_GEOJSON.zip",
        "table": "標高: G04-a-11_<一次メッシュ>-jgd_GML.zip（176ファイル）/ 人口: 1km_mesh_2024_<県>_GEOJSON",
        "valueColumn": "標高 G04a_002（平均標高m） × 人口 PTN_2020（2020年男女計総数人口）",
        "dataYear": "人口: 令和2年(2020)国勢調査 / 標高: 2009年5月時点の基盤地図情報DEM（2011年度版）",
        "accessedAt": "2026-10-08",
        "extraction": "3次メッシュコードの完全一致で結合（両側の境界が3次メッシュコードの区画と一致することを全メッシュで検査）。平均標高が5m以下のメッシュの人口を県別に合計。標高不明のメッシュ人口は低地に含めない。人口按分なし",
        "verification": "県別のメッシュ人口合計が国勢調査2020の都道府県人口（total-population 2020）と47県すべてで整数一致、全国126,146,099人。分類帯の合計も県別に一致。標高の値は公開TopoJSON複製と公式ZIPで488,300メッシュすべて一致",
        "restore": "python3 -I packages/gis/src/geo-analysis/low-elevation-population-overlay.py build --g04-dir <G04-a-11公式ZIP176件のdir> --population-zip <1km_mesh_2024_GEOJSON.zip> --census-values <app/stats/total-population/values.json> --out-root .local/r2 && python3 -I packages/gis/src/geo-analysis/low-elevation-population-overlay.py audit --out-root .local/r2",
      },
    },
    "displayName": "国土数値情報（標高・傾斜度3次メッシュ、1kmメッシュ別将来推計人口）",
    "url": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-G04-a.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "surveyScope": "not-applicable",
  "surveyScopeReason": "国土数値情報の標高メッシュと国勢調査基準のメッシュ人口を空間結合した派生値で、統計調査そのものの集計表ではないため",
  "isActive": true,
};

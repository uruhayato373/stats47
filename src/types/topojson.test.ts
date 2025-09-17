/**
 * TopoJSON型定義のテストファイル
 */

import {
  JapanPrefectureTopoJSON,
  PREFECTURE_CODES,
  PrefectureCode,
} from "./topojson";

// 型定義のテスト用のサンプルデータ
const sampleTopoJSON: JapanPrefectureTopoJSON = {
  type: "Topology",
  id: "iso3166-1:jp",
  metadata: {
    type: ["行政区境界"],
    "dc:title": "日本 都道府県:低解像度TopoJSON",
    "dc:source": "N03-23_01_230101.shp含め47ファイル",
    "dc:issued": "2023-01-01",
    "dc:subject": ["N03", "行政区域", "政策区域", "行政区境界"],
    "cc:license": "http://creativecommons.org/licenses/by-sa/4.0/",
    "cc:useGuidelines":
      "http://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03.html",
    "cc:attributionText":
      "国土交通省「国土数値情報（行政区域データ）」をもとにNIIが加工",
    "cc:attributionURL": "http://nlftp.mlit.go.jp/ksj/",
  },
  bbox: [122.93267356, 20.42276189, 153.9866572, 45.557235],
  transform: {
    scale: [0.00003105401469401469, 0.00002513449824449824],
    translate: [122.93267356, 20.42276189],
  },
  objects: {
    pref: {
      type: "GeometryCollection",
      geometries: [],
    },
  },
  arcs: [],
};

// 都道府県コードのテスト
const testPrefectureCode: PrefectureCode = "01";
const prefectureName = PREFECTURE_CODES[testPrefectureCode]; // "北海道"

console.log("型定義のテスト完了:", {
  sampleTopoJSON: sampleTopoJSON.type,
  prefectureCode: testPrefectureCode,
  prefectureName: prefectureName,
});

export { sampleTopoJSON };

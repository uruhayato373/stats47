/**
 * TopoJSON型定義
 * 日本の都道府県境界データ（jp_pref.l.topojson）用の型定義
 */

import { PREFECTURE_MAP } from "@/lib/prefecture";

// 基本の座標型
export type Coordinate = [number, number];

// アーク（弧）の型
export type Arc = Coordinate[];

// メタデータの型
export interface TopoJSONMetadata {
  type: string[];
  "dc:title": string;
  "dc:source": string;
  "dc:issued": string;
  "dc:subject": string[];
  "cc:license": string;
  "cc:useGuidelines": string;
  "cc:attributionText": string;
  "cc:attributionURL": string;
}

// 変換情報の型
export interface TopoJSONTransform {
  scale: [number, number];
  translate: [number, number];
}

// 都道府県のプロパティ型
export interface PrefectureProperties {
  N03_001: string; // 都道府県名
  N03_007: string; // 都道府県コード
}

// MultiPolygonジオメトリの型
export interface MultiPolygonGeometry {
  type: "MultiPolygon";
  arcs: number[][][];
  id: string;
  properties: PrefectureProperties;
}

// GeometryCollectionの型
export interface GeometryCollection {
  type: "GeometryCollection";
  geometries: MultiPolygonGeometry[];
}

// 都道府県オブジェクトの型（topojson-clientとの互換性のため）
export interface PrefectureObject {
  [key: string]: GeometryCollection;
  pref: GeometryCollection;
}

// メインのTopoJSON型
export interface JapanPrefectureTopoJSON {
  type: "Topology";
  id: string;
  metadata: TopoJSONMetadata;
  bbox: [number, number, number, number];
  transform: TopoJSONTransform;
  objects: PrefectureObject;
  arcs: Arc[];
}

// 都道府県データの簡易型（アプリケーション用）
export interface PrefectureData {
  id: string;
  name: string;
  code: string;
  geometry: MultiPolygonGeometry;
}

// 都道府県コードの型（lib/prefectureから参照）
export type PrefectureCodeLiteral = keyof typeof PREFECTURE_MAP;

// 都道府県名の型
export type PrefectureName = (typeof PREFECTURE_MAP)[PrefectureCodeLiteral];

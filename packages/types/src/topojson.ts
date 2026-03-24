/**
 * TopoJSON型定義
 *
 * topojson-clientライブラリと互換性のあるTopoJSONの型定義。
 * アプリケーション間で共有される汎用的な型定義。
 */

/**
 * TopoJSONトポロジー型
 *
 * topojson-clientライブラリと互換性のあるTopoJSONトポロジーの型定義。
 */
export interface TopoJSONTopology {
  type: "Topology";
  objects: Record<string, TopoJSONGeometryCollection>;
  arcs: number[][][];
  transform?: {
    scale: [number, number];
    translate: [number, number];
  };
  bbox?: [number, number, number, number];
  metadata?: Record<string, unknown>;
}

/**
 * TopoJSONジオメトリコレクション型
 *
 * TopoJSONトポロジー内のオブジェクト構造を表す。
 */
export interface TopoJSONGeometryCollection {
  type: "GeometryCollection";
  geometries: TopoJSONGeometry[];
}

/**
 * TopoJSONジオメトリ型
 *
 * TopoJSON内の個別のジオメトリを表す。
 */
export interface TopoJSONGeometry {
  type: string;
  arcs?: number[][] | number[][][];
  properties?: Record<string, unknown>;
  id?: string | number;
}

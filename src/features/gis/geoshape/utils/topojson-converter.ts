/**
 * Geoshapeドメイン - TopoJSON変換ユーティリティ
 *
 * TopoJSONの妥当性検証とGeoJSONへの変換機能を提供。
 * TopoJSONデータの検証、TopoJSONからGeoJSONへの変換を行う。
 */

import type { TopoJSONTopology } from "../types/index";

/**
 * TopoJSONの妥当性を検証
 *
 * 型ガード関数として、指定されたデータが有効なTopoJSONトポロジーかどうかを判定する。
 *
 * @param topology - 検証対象のデータ
 * @returns 有効なTopoJSONトポロジーの場合 `true`、それ以外は `false`
 *
 * @example
 * ```typescript
 * const data: unknown = await fetchTopology();
 * if (validateTopojson(data)) {
 *   // data は TopoJSONTopology 型として扱える
 *   console.log(data.objects);
 * }
 * ```
 */
export function validateTopojson(
  topology: unknown
): topology is TopoJSONTopology {
  if (topology === null || typeof topology !== "object") {
    return false;
  }

  const obj = topology as Record<string, unknown>;

  return (obj.type === "Topology" &&
    obj.objects !== null &&
    typeof obj.objects === "object" &&
    Array.isArray(obj.arcs)) as boolean;
}

/**
 * TopoJSONをGeoJSONに変換
 *
 * TopoJSONトポロジーデータをGeoJSON FeatureCollection形式に変換する。
 * 簡易的な実装のため、実際の本番環境では `topojson-client` ライブラリの使用を推奨。
 *
 * @param topoJson - TopoJSONデータ
 * @param objectName - 変換対象のオブジェクト名（省略時は最初のオブジェクトを使用）
 * @returns GeoJSON FeatureCollectionデータ
 * @throws TopoJSONが無効な場合、または指定されたオブジェクトが見つからない場合
 *
 * @example
 * ```typescript
 * const geojson = convertTopoJsonToGeoJson(topoJson, "prefectures");
 * console.log(geojson.features.length); // 都道府県の数
 * ```
 */
export function convertTopoJsonToGeoJson(
  topoJson: unknown,
  objectName?: string
): GeoJSON.FeatureCollection {
  if (
    !topoJson ||
    typeof topoJson !== "object" ||
    !("type" in topoJson) ||
    (topoJson as { type: unknown }).type !== "Topology"
  ) {
    throw new Error("Invalid TopoJSON: missing or invalid type");
  }

  const topology = topoJson as {
    type: "Topology";
    objects: Record<string, unknown>;
  };

  if (!topology.objects || typeof topology.objects !== "object") {
    throw new Error("Invalid TopoJSON: missing objects");
  }

  // オブジェクト名の決定
  const targetObjectName = objectName || Object.keys(topology.objects)[0];

  if (!targetObjectName || !topology.objects[targetObjectName]) {
    throw new Error(`Invalid TopoJSON: object '${targetObjectName}' not found`);
  }

  const object = topology.objects[targetObjectName] as
    | {
        type: "GeometryCollection";
        geometries: Array<{
          type: string;
          properties?: Record<string, unknown>;
        }>;
      }
    | {
        geometries: Array<{
          type: string;
          properties?: Record<string, unknown>;
          coordinates?: unknown;
        }>;
      };

  // 簡易的な変換（実際の実装ではtopojson-clientライブラリを使用）
  const features: GeoJSON.Feature[] = [];

  if ("geometries" in object && Array.isArray(object.geometries)) {
    if ("type" in object && object.type === "GeometryCollection") {
      // GeometryCollection形式
      for (const geometry of object.geometries) {
        features.push({
          type: "Feature",
          properties: geometry.properties || {},
          geometry: geometry as GeoJSON.Geometry,
        });
      }
    } else {
      // MultiPolygon形式またはPolygon形式
      for (const geometry of object.geometries) {
        if ("coordinates" in geometry) {
          if (geometry.type === "MultiPolygon") {
            features.push({
              type: "Feature",
              properties: geometry.properties || {},
              geometry: {
                type: "MultiPolygon",
                coordinates: geometry.coordinates as number[][][][],
              },
            });
          } else if (geometry.type === "Polygon") {
            features.push({
              type: "Feature",
              properties: geometry.properties || {},
              geometry: {
                type: "Polygon",
                coordinates: geometry.coordinates as number[][][],
              },
            });
          }
        }
      }
    }
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * TopoJSONの検証（詳細版）
 *
 * TopoJSONデータの妥当性を詳細に検証し、エラーメッセージの配列を返す。
 * `validateTopojson` よりも詳細な検証が必要な場合に使用する。
 *
 * @param data - 検証対象のデータ
 * @returns 検証結果（有効性とエラーメッセージの配列）
 *
 * @example
 * ```typescript
 * const result = validateTopoJson(topology);
 * if (!result.isValid) {
 *   console.error("Validation errors:", result.errors);
 * }
 * ```
 */
export function validateTopoJson(data: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data) {
    errors.push("Data is null or undefined");
    return { isValid: false, errors };
  }

  if (typeof data !== "object") {
    errors.push(`Invalid type: expected object, got ${typeof data}`);
    return { isValid: false, errors };
  }

  const topology = data as Record<string, unknown>;

  if (topology.type !== "Topology") {
    errors.push(
      `Invalid type: expected 'Topology', got '${String(topology.type)}'`
    );
  }

  if (!topology.objects || typeof topology.objects !== "object") {
    errors.push("Missing or invalid 'objects' property");
  }

  if (!Array.isArray(topology.arcs)) {
    errors.push("Missing or invalid 'arcs' property");
  }

  if (topology.objects && typeof topology.objects === "object") {
    const objects = topology.objects as Record<string, unknown>;
    const objectNames = Object.keys(objects);
    if (objectNames.length === 0) {
      errors.push("No objects found in TopoJSON");
    }

    for (const objectName of objectNames) {
      const object = objects[objectName];
      if (
        !object ||
        typeof object !== "object" ||
        !("type" in object) ||
        !(object as { type: unknown }).type
      ) {
        errors.push(`Object '${objectName}' missing type`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

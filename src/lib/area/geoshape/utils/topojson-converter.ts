/**
 * TopoJSON ↔ GeoJSON 変換ユーティリティ
 *
 * GeoShapeデータの形式変換を担当
 */

/**
 * TopoJSONをGeoJSONに変換
 *
 * @param topoJson - TopoJSONデータ
 * @param objectName - 変換対象のオブジェクト名（デフォルト: 最初のオブジェクト）
 * @returns GeoJSON.FeatureCollection
 */
export function convertTopoJsonToGeoJson(
  topoJson: any,
  objectName?: string
): GeoJSON.FeatureCollection {
  if (!topoJson || topoJson.type !== "Topology") {
    throw new Error("Invalid TopoJSON: missing or invalid type");
  }

  if (!topoJson.objects || typeof topoJson.objects !== "object") {
    throw new Error("Invalid TopoJSON: missing objects");
  }

  // オブジェクト名の決定
  const targetObjectName = objectName || Object.keys(topoJson.objects)[0];

  if (!targetObjectName || !topoJson.objects[targetObjectName]) {
    throw new Error(`Invalid TopoJSON: object '${targetObjectName}' not found`);
  }

  const object = topoJson.objects[targetObjectName];

  // 簡易的な変換（実際の実装ではtopojson-clientライブラリを使用）
  const features: GeoJSON.Feature[] = [];

  if (object.geometries) {
    // MultiPolygon形式
    for (const geometry of object.geometries) {
      if (geometry.type === "MultiPolygon") {
        features.push({
          type: "Feature",
          properties: geometry.properties || {},
          geometry: {
            type: "MultiPolygon",
            coordinates: geometry.coordinates,
          },
        });
      } else if (geometry.type === "Polygon") {
        features.push({
          type: "Feature",
          properties: geometry.properties || {},
          geometry: {
            type: "Polygon",
            coordinates: geometry.coordinates,
          },
        });
      }
    }
  } else if (object.type === "GeometryCollection") {
    // GeometryCollection形式
    for (const geometry of object.geometries) {
      features.push({
        type: "Feature",
        properties: geometry.properties || {},
        geometry: geometry,
      });
    }
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * GeoJSONをTopoJSONに変換（簡易版）
 *
 * @param geoJson - GeoJSONデータ
 * @returns TopoJSONデータ
 */
export function convertGeoJsonToTopoJson(
  geoJson: GeoJSON.FeatureCollection
): any {
  // 簡易的な変換（実際の実装ではtopojsonライブラリを使用）
  const geometries = geoJson.features.map((feature) => ({
    type: feature.geometry.type,
    properties: feature.properties,
    coordinates: feature.geometry.coordinates,
  }));

  return {
    type: "Topology",
    objects: {
      geoshape: {
        type: "GeometryCollection",
        geometries,
      },
    },
    arcs: [], // 実際の実装では適切に計算
  };
}

/**
 * TopoJSONの検証
 *
 * @param data - 検証対象のデータ
 * @returns 検証結果
 */
export function validateTopoJson(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data) {
    errors.push("Data is null or undefined");
    return { isValid: false, errors };
  }

  if (data.type !== "Topology") {
    errors.push(`Invalid type: expected 'Topology', got '${data.type}'`);
  }

  if (!data.objects || typeof data.objects !== "object") {
    errors.push("Missing or invalid 'objects' property");
  }

  if (!Array.isArray(data.arcs)) {
    errors.push("Missing or invalid 'arcs' property");
  }

  if (data.objects) {
    const objectNames = Object.keys(data.objects);
    if (objectNames.length === 0) {
      errors.push("No objects found in TopoJSON");
    }

    for (const objectName of objectNames) {
      const object = data.objects[objectName];
      if (!object.type) {
        errors.push(`Object '${objectName}' missing type`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * GeoJSONの検証
 *
 * @param data - 検証対象のデータ
 * @returns 検証結果
 */
export function validateGeoJson(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data) {
    errors.push("Data is null or undefined");
    return { isValid: false, errors };
  }

  if (data.type !== "FeatureCollection") {
    errors.push(
      `Invalid type: expected 'FeatureCollection', got '${data.type}'`
    );
  }

  if (!Array.isArray(data.features)) {
    errors.push("Missing or invalid 'features' property");
  } else {
    for (let i = 0; i < data.features.length; i++) {
      const feature = data.features[i];
      if (feature.type !== "Feature") {
        errors.push(`Feature ${i}: invalid type '${feature.type}'`);
      }
      if (!feature.geometry) {
        errors.push(`Feature ${i}: missing geometry`);
      }
      if (!feature.properties) {
        errors.push(`Feature ${i}: missing properties`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * データサイズの計算
 *
 * @param data - データ
 * @returns バイト数
 */
export function calculateDataSize(data: any): number {
  try {
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  } catch (error) {
    console.warn("Failed to calculate data size:", error);
    return 0;
  }
}

/**
 * データ圧縮率の計算
 *
 * @param originalSize - 元のサイズ
 * @param compressedSize - 圧縮後のサイズ
 * @returns 圧縮率（0-1）
 */
export function calculateCompressionRatio(
  originalSize: number,
  compressedSize: number
): number {
  if (originalSize === 0) return 0;
  return 1 - compressedSize / originalSize;
}

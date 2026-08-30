/**
 * GeoJSON → TopoJSON 変換
 *
 * topojson-server で変換 → topojson-simplify で簡略化。
 */

import * as fs from "node:fs";
import proj4 from "proj4";
import * as topojsonServer from "topojson-server";
import * as topojsonSimplify from "topojson-simplify";
import type { Topology } from "topojson-specification";

import type { KsjSimplifyOptions } from "./types";
import { getPropertyMap } from "./property-map";

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: unknown;
    properties: Record<string, unknown> | null;
  }>;
}

export type KsjSourceDatum = "jgd" | "tokyo";

export function partitionByLimits<T>(
  items: readonly T[],
  sizeOf: (item: T) => number,
  limits: { maxItems: number; maxBytes: number },
): T[][] {
  if (limits.maxItems < 1 || limits.maxBytes < 1) {
    throw new Error("partition limits must be positive");
  }
  const groups: T[][] = [];
  let group: T[] = [];
  let groupBytes = 0;
  for (const item of items) {
    const itemBytes = sizeOf(item);
    if (itemBytes < 0) throw new Error("partition item size must be non-negative");
    if (
      group.length > 0 &&
      (group.length >= limits.maxItems || groupBytes + itemBytes > limits.maxBytes)
    ) {
      groups.push(group);
      group = [];
      groupBytes = 0;
    }
    group.push(item);
    groupBytes += itemBytes;
  }
  if (group.length > 0) groups.push(group);
  return groups;
}

const TOKYO_DATUM =
  "+proj=longlat +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +no_defs";

function transformCoordinateTree(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    const [longitude, latitude] = proj4(TOKYO_DATUM, "EPSG:4326", [
      value[0],
      value[1],
    ]);
    return [longitude, latitude, ...value.slice(2)];
  }
  return value.map(transformCoordinateTree);
}

export function transformTokyoDatumGeometry(geometry: unknown): unknown {
  if (!geometry || typeof geometry !== "object") return geometry;
  const candidate = geometry as { coordinates?: unknown; geometries?: unknown[] };
  if (candidate.coordinates !== undefined) {
    return {
      ...candidate,
      coordinates: transformCoordinateTree(candidate.coordinates),
    };
  }
  if (Array.isArray(candidate.geometries)) {
    return {
      ...candidate,
      geometries: candidate.geometries.map(transformTokyoDatumGeometry),
    };
  }
  return geometry;
}

/** 国土数値情報の一部GeoJSONにあるBOMとJSON本体外の末尾NUL paddingだけを除去する。 */
export function parseKsjGeoJsonText(text: string): GeoJSONFeatureCollection {
  const normalized = text.replace(/^\uFEFF/u, "").replace(/[\u0000\s]+$/u, "");
  return JSON.parse(normalized) as GeoJSONFeatureCollection;
}

/**
 * GeoJSON ファイルを読み込み、プロパティをリマップして TopoJSON に変換
 */
export function convertGeoJsonToTopoJson(
  geojsonPath: string,
  dataId: string,
  simplifyOptions: KsjSimplifyOptions,
  sourceDatum: KsjSourceDatum = "jgd",
): { topology: Topology; featureCount: number } {
  return convertGeoJsonFilesToTopoJson(
    [geojsonPath],
    dataId,
    simplifyOptions,
    sourceDatum,
  );
}

/** 1つの公式配布archiveに分割収録されたGeoJSONを、1つのTopologyへ統合する。 */
export function convertGeoJsonFilesToTopoJson(
  geojsonPaths: readonly string[],
  dataId: string,
  simplifyOptions: KsjSimplifyOptions,
  sourceDatum: KsjSourceDatum = "jgd",
): { topology: Topology; featureCount: number } {
  if (geojsonPaths.length === 0) throw new Error("GeoJSON入力が0件です");
  const geojson: GeoJSONFeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };
  for (const geojsonPath of geojsonPaths) {
    const parsed = parseKsjGeoJsonText(fs.readFileSync(geojsonPath, "utf-8"));
    if (parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
      throw new Error(`Invalid GeoJSON: expected FeatureCollection (${geojsonPath})`);
    }
    // `push(...features)`は洪水浸水想定のような巨大配列でV8の引数上限を超える。
    for (const feature of parsed.features) geojson.features.push(feature);
  }

  return convertGeoJsonFeatureCollectionToTopoJson(
    geojson,
    dataId,
    simplifyOptions,
    sourceDatum,
  );
}

export function convertGeoJsonFeatureCollectionToTopoJson(
  geojson: GeoJSONFeatureCollection,
  dataId: string,
  simplifyOptions: KsjSimplifyOptions,
  sourceDatum: KsjSourceDatum = "jgd",
): { topology: Topology; featureCount: number } {

  const featureCount = geojson.features.length;
  console.log(`  Feature 数: ${featureCount}`);

  if (sourceDatum === "tokyo") {
    for (const feature of geojson.features) {
      feature.geometry = transformTokyoDatumGeometry(feature.geometry);
    }
    console.log("  測地系変換: Tokyo Datum → WGS84");
  }

  // プロパティ名をリマップ
  const propertyMap = getPropertyMap(dataId);
  if (Object.keys(propertyMap).length > 0) {
    for (const feature of geojson.features) {
      if (!feature.properties) continue;
      const remapped: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(feature.properties)) {
        const newKey = propertyMap[key] ?? key;
        remapped[newKey] = value;
      }
      feature.properties = remapped;
    }
    console.log(
      `  プロパティリマップ: ${Object.keys(propertyMap).length} 項目`
    );
  }

  // GeoJSON → TopoJSON
  const objectName = dataId.toLowerCase();
  const topo = topojsonServer.topology(
    { [objectName]: geojson as never },
    simplifyOptions.quantize
  );

  // 簡略化（ポイントデータは不要）
  if (simplifyOptions.simplifyQuantile > 0) {
    const presimplified = topojsonSimplify.presimplify(topo as never);
    const minWeight = topojsonSimplify.quantile(
      presimplified,
      simplifyOptions.simplifyQuantile
    );
    const simplified = topojsonSimplify.simplify(presimplified, minWeight);
    console.log(
      `  簡略化: quantize=${simplifyOptions.quantize}, quantile=${simplifyOptions.simplifyQuantile}`
    );
    return { topology: simplified as unknown as Topology, featureCount };
  }

  return { topology: topo as unknown as Topology, featureCount };
}

/**
 * TopoJSON をファイルに保存
 */
export function saveTopoJson(topology: Topology, outputPath: string): number {
  const dir = outputPath.replace(/\/[^/]+$/, "");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const json = JSON.stringify(topology);
  fs.writeFileSync(outputPath, json, "utf-8");
  const sizeBytes = Buffer.byteLength(json, "utf-8");
  console.log(
    `  保存: ${outputPath} (${(sizeBytes / 1024 / 1024).toFixed(2)}MB)`
  );
  return sizeBytes;
}

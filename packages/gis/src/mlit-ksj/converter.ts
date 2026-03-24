/**
 * GeoJSON → TopoJSON 変換
 *
 * topojson-server で変換 → topojson-simplify で簡略化。
 */

import * as fs from "node:fs";
import * as topojsonServer from "topojson-server";
import * as topojsonSimplify from "topojson-simplify";
import type { Topology } from "topojson-specification";

import type { KsjSimplifyOptions } from "./types";
import { getPropertyMap } from "./property-map";

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: unknown;
    properties: Record<string, unknown> | null;
  }>;
}

/**
 * GeoJSON ファイルを読み込み、プロパティをリマップして TopoJSON に変換
 */
export function convertGeoJsonToTopoJson(
  geojsonPath: string,
  dataId: string,
  simplifyOptions: KsjSimplifyOptions
): { topology: Topology; featureCount: number } {
  console.log(`  変換中: ${geojsonPath}`);

  const raw = fs.readFileSync(geojsonPath, "utf-8");
  const geojson: GeoJSONFeatureCollection = JSON.parse(raw);

  if (
    geojson.type !== "FeatureCollection" ||
    !Array.isArray(geojson.features)
  ) {
    throw new Error(`Invalid GeoJSON: expected FeatureCollection`);
  }

  const featureCount = geojson.features.length;
  console.log(`  Feature 数: ${featureCount}`);

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

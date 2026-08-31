#!/usr/bin/env tsx

import * as fs from "node:fs";
import { createHash } from "node:crypto";
import * as path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

import { fetchPrefectures } from "@stats47/area";
import { BUSINESS_PLAN_M1_GEO_ANALYSES } from "@stats47/data-configs/business-plan";
import { feature as topologyFeature } from "topojson-client";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
  Position,
} from "geojson";
import type { GeometryObject, Topology } from "topojson-specification";
import unzipper from "unzipper";

import {
  assertFloodConservation,
  assertLandPriceConservation,
  buildFloodPrefDetail,
  buildLandPricePrefDetail,
  type LandPriceDetailPointInput,
} from "../../geo-analysis/content-details";
import {
  coordinateBounds,
  geometryCenter,
  mesh1000BoundsFromCode,
  median,
  pointInMultiPolygon,
  rankAreaRows,
  round,
  type Coordinate,
  type PopulationMeshPoint,
} from "../../geo-analysis/geo-analysis-core";
import {
  assertStationAccessConservation,
  calculateStationAccessibility,
  stationsWithinRadiusOfMeshes,
  type StationAccessPoint,
} from "../../geo-analysis/station-access";
import {
  GEO_STATION_ACCESS_MANIFEST_KEY,
  geoAnalysisManifestKey,
  geoAnalysisPrefKey,
  geoStationAccessPrefKey,
} from "../../geo-analysis/snapshot";
import type {
  GeoAnalysisArtifactEvidence,
  GeoAnalysisEvidenceManifest,
  GeoAnalysisInputEvidence,
  GeoAnalysisMetricDefinition,
  GeoAnalysisSnapshot,
  GeoAnalysisSnapshotRow,
  GeoAnalysisSource,
  GeoFloodPrefDetail,
  GeoLandPricePrefDetail,
  GeoStationAccessMeshCell,
  GeoStationAccessPrefDetail,
  GeoStationAccessStation,
} from "../../geo-analysis/snapshot";

const R2_PUBLIC_BASE = (
  process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp"
).replace(/\/+$/, "");
const POPULATION_VERSION = "24";
const LAND_PRICE_VERSION = "26";
const STATION_VERSION = "25";
const FLOOD_VERSION = "25";
const FLOOD_GRID_DEGREES = 0.01;
const EXPECTED_FLOOD_FILES = 94;
const LOCAL_R2_ROOT = path.resolve(".local/r2");
const OUTPUT_ROOT = path.resolve(".local/r2/app/geo");
const MAX_GEO_DETAIL_BYTES = 5_000_000;
const FLOOD_SOURCE_ROOT = path.resolve(
  `.local/r2/gis/mlit-ksj/A31b/${FLOOD_VERSION}/source`,
);
const FLOOD_PAGE =
  "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A31b-2025.html";

type JsonFeature = Feature<Geometry, GeoJsonProperties>;
type NumericProperties = Record<string, unknown>;

interface AreaAccumulator {
  population2020: number;
  population2050: number;
  residentialPrices: number[];
  residentialPriceChanges: number[];
}

interface StationAccumulator {
  id: string;
  name: string;
  longitudeTotal: number;
  latitudeTotal: number;
  count: number;
}

interface InputJsonEvidence {
  readonly key: string;
  readonly sha256: string;
  readonly bytes: number;
}

interface PassengerContextEvidence {
  readonly inputs: GeoAnalysisInputEvidence[];
  readonly outputs: GeoAnalysisArtifactEvidence[];
}

function assertOk(response: Response, url: string): Response {
  if (!response.ok) {
    throw new Error(`取得失敗: ${response.status} ${response.statusText} ${url}`);
  }
  return response;
}

async function fetchJsonWithEvidence<T>(
  url: string,
  key: string,
): Promise<{ value: T; evidence: InputJsonEvidence }> {
  const response = assertOk(
    await fetch(url, { headers: { "User-Agent": "stats47-geo-analysis/1.0" } }),
    url,
  );
  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    value: JSON.parse(bytes.toString("utf8")) as T,
    evidence: {
      key,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.byteLength,
    },
  };
}

function readTopology(filePath: string): Topology {
  if (!fs.existsSync(filePath)) {
    throw new Error(`GIS入力がありません: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Topology;
}

function topologyToFeatures(topology: Topology): JsonFeature[] {
  const object = Object.values(topology.objects)[0] as GeometryObject | undefined;
  if (!object) throw new Error("TopoJSON objects が空です");
  const converted = topologyFeature(topology, object);
  if (converted.type === "FeatureCollection") {
    return converted.features as JsonFeature[];
  }
  return [converted as JsonFeature];
}

function numberProperty(
  properties: GeoJsonProperties,
  key: string,
): number | null {
  const value = properties?.[key];
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function stringProperty(
  properties: GeoJsonProperties,
  key: string,
): string | null {
  const value = properties?.[key];
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number") return String(value);
  return null;
}

function flattenPositions(geometry: Geometry): Coordinate[] {
  const positions: Coordinate[] = [];
  const visit = (value: unknown): void => {
    if (!Array.isArray(value)) return;
    if (
      value.length >= 2 &&
      typeof value[0] === "number" &&
      typeof value[1] === "number"
    ) {
      positions.push([value[0], value[1]]);
      return;
    }
    value.forEach(visit);
  };
  if (geometry.type !== "GeometryCollection") visit(geometry.coordinates);
  return positions;
}

function polygonBounds(
  geometry: Geometry,
): readonly [number, number, number, number] | null {
  const positions = flattenPositions(geometry);
  if (positions.length === 0) return null;
  let minLongitude = Number.POSITIVE_INFINITY;
  let minLatitude = Number.POSITIVE_INFINITY;
  let maxLongitude = Number.NEGATIVE_INFINITY;
  let maxLatitude = Number.NEGATIVE_INFINITY;
  for (const [longitude, latitude] of positions) {
    minLongitude = Math.min(minLongitude, longitude);
    minLatitude = Math.min(minLatitude, latitude);
    maxLongitude = Math.max(maxLongitude, longitude);
    maxLatitude = Math.max(maxLatitude, latitude);
  }
  return [minLongitude, minLatitude, maxLongitude, maxLatitude];
}

async function loadPopulationMeshes(): Promise<{
  meshes: PopulationMeshPoint[];
  inputs: GeoAnalysisInputEvidence[];
}> {
  const records: PopulationMeshPoint[] = [];
  const inputs: GeoAnalysisInputEvidence[] = [];
  for (const [index, prefecture] of fetchPrefectures().entries()) {
    const prefCode = prefecture.prefCode.slice(0, 2);
    const key = `gis/mlit-ksj/mesh1000r6/${POPULATION_VERSION}/${prefCode}.topojson`;
    const url = `${R2_PUBLIC_BASE}/${key}`;
    const { value: topology, evidence } = await fetchJsonWithEvidence<Topology>(
      url,
      key,
    );
    inputs.push({
      layerId: "ipss-population-mesh-1km",
      datasetId: "mesh1000r6",
      version: POPULATION_VERSION,
      key: evidence.key,
      sha256: evidence.sha256,
      bytes: evidence.bytes,
      geometry: "mesh",
      role: "calculation-input",
      usedInCalculation: true,
    });
    const features = topologyToFeatures(topology);
    for (const current of features) {
      const meshId = stringProperty(current.properties, "MESH_ID");
      const population2020 = numberProperty(current.properties, "PTN_2020") ?? 0;
      const population2050 = numberProperty(current.properties, "PTN_2050") ?? 0;
      if (!meshId || (population2020 <= 0 && population2050 <= 0)) continue;
      const bounds =
        mesh1000BoundsFromCode(meshId) ??
        (current.geometry ? polygonBounds(current.geometry) : null);
      if (!bounds) continue;
      records.push({
        meshId,
        areaCode: prefecture.prefCode,
        longitude: (bounds[0] + bounds[2]) / 2,
        latitude: (bounds[1] + bounds[3]) / 2,
        population2020,
        population2050,
        bounds,
      });
    }
    console.log(
      `人口メッシュ ${index + 1}/47 ${prefecture.prefName}: ${features.length} features`,
    );
  }
  return { meshes: records, inputs };
}

function createAreaAccumulators(
  populationMeshes: readonly PopulationMeshPoint[],
): Map<string, AreaAccumulator> {
  const result = new Map<string, AreaAccumulator>();
  for (const prefecture of fetchPrefectures()) {
    result.set(prefecture.prefCode, {
      population2020: 0,
      population2050: 0,
      residentialPrices: [],
      residentialPriceChanges: [],
    });
  }
  for (const mesh of populationMeshes) {
    const accumulator = result.get(mesh.areaCode);
    if (!accumulator) continue;
    accumulator.population2020 += mesh.population2020;
    accumulator.population2050 += mesh.population2050;
  }
  return result;
}

function loadLandPricePoints(
  accumulators: Map<string, AreaAccumulator>,
): { points: LandPriceDetailPointInput[]; input: GeoAnalysisInputEvidence } {
  const key = `gis/mlit-ksj/L01/${LAND_PRICE_VERSION}/national.topojson`;
  const inputPath = path.resolve(`.local/r2/${key}`);
  const topology = readTopology(inputPath);
  const features = topologyToFeatures(topology);
  const points: LandPriceDetailPointInput[] = [];
  for (const [index, current] of features.entries()) {
    if (stringProperty(current.properties, "L01_002") !== "000") continue;
    const municipalityCode = stringProperty(current.properties, "L01_001");
    const price = numberProperty(current.properties, "L01_008");
    const priceChange = numberProperty(current.properties, "L01_009");
    if (!municipalityCode || price === null || price <= 0) continue;
    if (!current.geometry) continue;
    const center = geometryCenter(flattenPositions(current.geometry));
    if (!center) continue;
    const accumulator = accumulators.get(`${municipalityCode.slice(0, 2)}000`);
    if (!accumulator) continue;
    accumulator.residentialPrices.push(price);
    if (priceChange !== null) accumulator.residentialPriceChanges.push(priceChange);
    points.push({
      id: `${municipalityCode}-${stringProperty(current.properties, "L01_003") ?? index + 1}`,
      areaCode: `${municipalityCode.slice(0, 2)}000`,
      longitude: center[0],
      latitude: center[1],
      price,
      change: priceChange,
    });
  }
  if (new Set(points.map((point) => point.id)).size !== points.length) {
    throw new Error("住宅地地価地点IDが重複しています");
  }
  return {
    points,
    input: {
      layerId: "ksj-l01-residential-land-price",
      datasetId: "L01",
      version: LAND_PRICE_VERSION,
      key,
      sha256: fileSha256(inputPath),
      bytes: fs.statSync(inputPath).size,
      geometry: "point",
      role: "calculation-input",
      usedInCalculation: true,
    },
  };
}

function stationFeatureCenter(
  geometry: LineString | MultiLineString,
): Coordinate | null {
  const positions = flattenPositions(geometry);
  return geometryCenter(positions);
}

function loadStationPoints(): {
  stations: StationAccessPoint[];
  input: GeoAnalysisInputEvidence;
} {
  const key = `gis/mlit-ksj/S12/${STATION_VERSION}/national.topojson`;
  const inputPath = path.resolve(`.local/r2/${key}`);
  const topology = readTopology(inputPath);
  const features = topologyToFeatures(topology);
  const groups = new Map<string, StationAccumulator>();
  for (const current of features) {
    if (
      current.geometry?.type !== "LineString" &&
      current.geometry?.type !== "MultiLineString"
    ) {
      continue;
    }
    const groupCode =
      stringProperty(current.properties, "stationGroupCode") ??
      stringProperty(current.properties, "stationCode");
    if (!groupCode) continue;
    const center = stationFeatureCenter(current.geometry);
    if (!center) continue;
    const previous = groups.get(groupCode) ?? {
      id: groupCode,
      name: stringProperty(current.properties, "stationName") ?? "駅名不明",
      longitudeTotal: 0,
      latitudeTotal: 0,
      count: 0,
    };
    groups.set(groupCode, {
      id: previous.id,
      name: previous.name,
      longitudeTotal: previous.longitudeTotal + center[0],
      latitudeTotal: previous.latitudeTotal + center[1],
      count: previous.count + 1,
    });
  }
  return {
    stations: [...groups.values()].map((group) => ({
      id: group.id,
      name: group.name,
      longitude: group.longitudeTotal / group.count,
      latitude: group.latitudeTotal / group.count,
    })),
    input: {
      layerId: "ksj-s12-station-point",
      datasetId: "S12",
      version: STATION_VERSION,
      key,
      sha256: fileSha256(inputPath),
      bytes: fs.statSync(inputPath).size,
      geometry: "line",
      role: "calculation-input",
      usedInCalculation: true,
    },
  };
}

function floodPolygons(
  geometry: Polygon | MultiPolygon,
): readonly (readonly (readonly Coordinate[])[])[] {
  const convertPolygon = (polygon: Position[][]): Coordinate[][] =>
    polygon.map((ring) =>
      ring.map((position) => [Number(position[0]), Number(position[1])]),
    );
  if (geometry.type === "Polygon") {
    return [convertPolygon(geometry.coordinates)];
  }
  return geometry.coordinates.map(convertPolygon);
}

function buildFloodMeshGrid(
  meshes: readonly PopulationMeshPoint[],
): Map<string, PopulationMeshPoint[]> {
  const result = new Map<string, PopulationMeshPoint[]>();
  for (const mesh of meshes) {
    const key = `${Math.floor(mesh.longitude / FLOOD_GRID_DEGREES)}:${Math.floor(
      mesh.latitude / FLOOD_GRID_DEGREES,
    )}`;
    result.set(key, [...(result.get(key) ?? []), mesh]);
  }
  return result;
}

function applyFloodFeatures(
  collection: FeatureCollection<Polygon | MultiPolygon, NumericProperties>,
  meshes: readonly PopulationMeshPoint[],
): number {
  const meshGrid = buildFloodMeshGrid(meshes);
  let matchedFeatures = 0;
  for (const current of collection.features) {
    const polygons = floodPolygons(current.geometry);
    const bounds = coordinateBounds(polygons);
    if (!bounds) continue;
    const depthClass = Number(current.properties?.A31b_201 ?? 0);
    const minLongitudeBin = Math.floor(bounds[0] / FLOOD_GRID_DEGREES);
    const minLatitudeBin = Math.floor(bounds[1] / FLOOD_GRID_DEGREES);
    const maxLongitudeBin = Math.floor(bounds[2] / FLOOD_GRID_DEGREES);
    const maxLatitudeBin = Math.floor(bounds[3] / FLOOD_GRID_DEGREES);
    let featureMatched = false;
    for (let x = minLongitudeBin; x <= maxLongitudeBin; x += 1) {
      for (let y = minLatitudeBin; y <= maxLatitudeBin; y += 1) {
        const candidates = meshGrid.get(`${x}:${y}`);
        if (!candidates) continue;
        for (const mesh of candidates) {
          if (
            pointInMultiPolygon(
              [mesh.longitude, mesh.latitude],
              polygons,
            )
          ) {
            mesh.floodDepthClass = Math.max(
              mesh.floodDepthClass ?? 0,
              depthClass,
            );
            featureMatched = true;
          }
        }
      }
    }
    if (featureMatched) matchedFeatures += 1;
  }
  return matchedFeatures;
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = assertOk(
    await fetch(url, { headers: { "User-Agent": "stats47-geo-analysis/1.0" } }),
    url,
  );
  if (!response.body) throw new Error(`レスポンス本文がありません: ${url}`);
  await pipeline(
    Readable.fromWeb(response.body as never),
    fs.createWriteStream(outputPath),
  );
}

function fileSha256(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

async function loadFloodUrls(): Promise<string[]> {
  const response = assertOk(await fetch(FLOOD_PAGE), FLOOD_PAGE);
  const html = await response.text();
  const matches = html.match(
    /\/ksj\/gml\/data\/A31b\/A31b-25\/A31b-25_20_[0-9]{4}_GEOJSON\.zip/g,
  );
  const urls = [...new Set(matches ?? [])]
    .sort()
    .map((value) => `https://nlftp.mlit.go.jp${value}`);
  if (urls.length !== EXPECTED_FLOOD_FILES) {
    throw new Error(
      `A31b 2025 想定最大規模のファイル数が想定外です: expected=${EXPECTED_FLOOD_FILES} actual=${urls.length}`,
    );
  }
  return urls;
}

async function markFloodExposure(
  populationMeshes: readonly PopulationMeshPoint[],
): Promise<{
  files: number;
  features: number;
  matchedFeatures: number;
  inputs: GeoAnalysisInputEvidence[];
  sourceOutputs: GeoAnalysisArtifactEvidence[];
}> {
  const byFirstMesh = new Map<string, PopulationMeshPoint[]>();
  for (const mesh of populationMeshes) {
    const firstMesh = mesh.meshId.slice(0, 4);
    byFirstMesh.set(firstMesh, [...(byFirstMesh.get(firstMesh) ?? []), mesh]);
  }

  const urls = await loadFloodUrls();
  fs.mkdirSync(FLOOD_SOURCE_ROOT, { recursive: true });
  const sourceFiles: Array<{
    objectKey: string;
    sourceUrl: string;
    bytes: number;
    sha256: string;
  }> = [];
  let featureCount = 0;
  let matchedFeatureCount = 0;
  const inputs: GeoAnalysisInputEvidence[] = [];
  const sourceOutputs: GeoAnalysisArtifactEvidence[] = [];

  for (const [index, url] of urls.entries()) {
    const firstMesh = url.match(/_([0-9]{4})_GEOJSON\.zip$/)?.[1];
    if (!firstMesh) throw new Error(`一次メッシュコードを読めません: ${url}`);
    const zipPath = path.join(FLOOD_SOURCE_ROOT, `${firstMesh}.zip`);
    if (!fs.existsSync(zipPath)) await downloadFile(url, zipPath);
    const zipStat = fs.statSync(zipPath);
    sourceFiles.push({
      objectKey: `gis/mlit-ksj/A31b/${FLOOD_VERSION}/source/${firstMesh}.zip`,
      sourceUrl: url,
      bytes: zipStat.size,
      sha256: fileSha256(zipPath),
    });
    const archive = await unzipper.Open.file(zipPath);
    const entry = archive.files.find((current: { path: string }) =>
      current.path.endsWith(`A31b-20-25_20_${firstMesh}.geojson`),
    );
    if (!entry) throw new Error(`想定最大規模GeoJSONがありません: ${url}`);
    const collection = JSON.parse(
      (await entry.buffer()).toString("utf8"),
    ) as FeatureCollection<Polygon | MultiPolygon, NumericProperties>;
    featureCount += collection.features.length;
    const objectKey = `gis/mlit-ksj/A31b/${FLOOD_VERSION}/source/${firstMesh}.zip`;
    const sha256 = fileSha256(zipPath);
    inputs.push({
      layerId: "ksj-a31b-flood-polygon",
      datasetId: "A31b",
      version: FLOOD_VERSION,
      key: objectKey,
      sha256,
      bytes: zipStat.size,
      geometry: "polygon",
      role: "calculation-input",
      usedInCalculation: true,
    });
    sourceOutputs.push({
      key: objectKey,
      sha256,
      bytes: zipStat.size,
      recordCount: collection.features.length,
    });
    const candidates = byFirstMesh.get(firstMesh) ?? [];
    if (candidates.length > 0) {
      matchedFeatureCount += applyFloodFeatures(collection, candidates);
    }
    console.log(
      `洪水 ${index + 1}/${urls.length} ${firstMesh}: ${collection.features.length} features / ${candidates.length} populated meshes`,
    );
  }
  fs.writeFileSync(
    path.join(FLOOD_SOURCE_ROOT, "_meta.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        datasetId: "A31b",
        version: FLOOD_VERSION,
        layer: "20",
        layerName: "想定最大規模",
        license: "CC BY 4.0",
        sourcePage: FLOOD_PAGE,
        fileCount: sourceFiles.length,
        totalBytes: sourceFiles.reduce((sum, file) => sum + file.bytes, 0),
        files: sourceFiles,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  return {
    files: urls.length,
    features: featureCount,
    matchedFeatures: matchedFeatureCount,
    inputs,
    sourceOutputs,
  };
}

function populationChangeRate(accumulator: AreaAccumulator): number {
  if (accumulator.population2020 <= 0) return 0;
  return round(
    ((accumulator.population2050 - accumulator.population2020) /
      accumulator.population2020) *
      100,
    2,
  );
}

function commonPopulationSource(): GeoAnalysisSource {
  return {
    name: "国土交通省『1kmメッシュ別将来推計人口（R6国政局推計）』",
    url: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-mesh1000r6.html",
    datasetId: "mesh1000r6",
    version: POPULATION_VERSION,
    license: "CC BY 4.0",
  };
}

function createSnapshot(input: {
  slug: string;
  generatedAt: string;
  title: string;
  question: string;
  primaryMetricKey: string;
  metrics: readonly GeoAnalysisMetricDefinition[];
  rows: readonly Omit<GeoAnalysisSnapshotRow, "rank">[];
  method: readonly string[];
  sources: readonly GeoAnalysisSource[];
  caveats: readonly string[];
  inputCounts: Readonly<Record<string, number>>;
  coverageNote: string;
}): GeoAnalysisSnapshot {
  const rankedRows = rankAreaRows(input.rows, input.primaryMetricKey);
  const prefectureCodes = new Set(fetchPrefectures().map((item) => item.prefCode));
  const actualCodes = new Set(rankedRows.map((item) => item.areaCode));
  const missingAreaCodes = [...prefectureCodes].filter(
    (code) => !actualCodes.has(code),
  );
  if (rankedRows.length !== 47 || missingAreaCodes.length > 0) {
    throw new Error(
      `${input.slug}: 都道府県coverage不良 actual=${rankedRows.length} missing=${missingAreaCodes.join(",")}`,
    );
  }
  const primaryValues = rankedRows
    .map((row) => row.values[input.primaryMetricKey])
    .filter((value): value is number => value !== null && value !== undefined);
  return {
    schemaVersion: 1,
    slug: input.slug,
    generatedAt: input.generatedAt,
    dataVersion: "2020-2050",
    geography: "prefecture",
    title: input.title,
    question: input.question,
    primaryMetricKey: input.primaryMetricKey,
    metrics: input.metrics,
    rows: rankedRows,
    summary: {
      observationCount: rankedRows.length,
      medianValue: round(median(primaryValues), 2),
      topAreaCodes: rankedRows.slice(0, 5).map((row) => row.areaCode),
      bottomAreaCodes: rankedRows.slice(-5).reverse().map((row) => row.areaCode),
    },
    method: input.method,
    sources: input.sources,
    caveats: input.caveats,
    dataQuality: {
      expectedAreas: 47,
      actualAreas: rankedRows.length,
      missingAreaCodes,
      inputCounts: input.inputCounts,
      coverageNote: input.coverageNote,
    },
  };
}

function writeJsonArtifact(
  key: string,
  value: unknown,
  recordCount: number,
  pretty = false,
  areaCode?: string,
): GeoAnalysisArtifactEvidence {
  const outputPath = path.join(LOCAL_R2_ROOT, key);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const body = `${JSON.stringify(value, null, pretty ? 2 : undefined)}\n`;
  fs.writeFileSync(outputPath, body, "utf8");
  const bytes = Buffer.byteLength(body);
  return {
    key,
    sha256: createHash("sha256").update(body).digest("hex"),
    bytes,
    recordCount,
    ...(areaCode ? { areaCode } : {}),
  };
}

function writeSnapshot(
  snapshot: GeoAnalysisSnapshot,
): GeoAnalysisArtifactEvidence {
  const outputDirectory = path.join(OUTPUT_ROOT, snapshot.slug);
  fs.mkdirSync(outputDirectory, { recursive: true });
  const key = `app/geo/${snapshot.slug}/item.json`;
  const evidence = writeJsonArtifact(
    key,
    snapshot,
    snapshot.rows.length,
    true,
  );
  console.log(`snapshot: ${path.join(LOCAL_R2_ROOT, key)}`);
  return evidence;
}

function quantizeCoordinate(value: number): number {
  return Math.round(value * 1_000_000);
}

function stationAccessPrefDetail(
  generatedAt: string,
  areaCode: string,
  areaName: string,
  meshes: readonly PopulationMeshPoint[],
  stations: readonly StationAccessPoint[],
): GeoStationAccessPrefDetail {
  const areaMeshes = meshes.filter((mesh) => mesh.areaCode === areaCode);
  if (areaMeshes.length === 0) {
    throw new Error(`${areaCode}: 人口メッシュがありません`);
  }
  const meshCells: GeoStationAccessMeshCell[] = areaMeshes.map((mesh) => {
    if (!mesh.bounds) {
      throw new Error(`${areaCode}: mesh bounds欠落 ${mesh.meshId}`);
    }
    return [
      mesh.meshId,
      quantizeCoordinate(mesh.bounds[0]),
      quantizeCoordinate(mesh.bounds[1]),
      quantizeCoordinate(mesh.bounds[2]),
      quantizeCoordinate(mesh.bounds[3]),
      mesh.population2020,
      mesh.population2050,
      mesh.isStationAccessible ? 1 : 0,
    ];
  });
  const displayedStations: GeoStationAccessStation[] =
    stationsWithinRadiusOfMeshes(areaMeshes, stations)
    .map((station) => [
      station.id,
      station.name,
      quantizeCoordinate(station.longitude),
      quantizeCoordinate(station.latitude),
    ]);
  const accessible = meshCells.filter((mesh) => mesh[7] === 1);
  const population2020 = meshCells.reduce((sum, mesh) => sum + mesh[5], 0);
  const population2050 = meshCells.reduce((sum, mesh) => sum + mesh[6], 0);
  const accessiblePopulation2020 = accessible.reduce(
    (sum, mesh) => sum + mesh[5],
    0,
  );
  const accessiblePopulation2050 = accessible.reduce(
    (sum, mesh) => sum + mesh[6],
    0,
  );
  return {
    schemaVersion: 1,
    slug: "population-station-access",
    generatedAt,
    areaCode,
    areaName,
    accessRadiusMeters: 800,
    meshMethod: "center-point",
    meshes: meshCells,
    stations: displayedStations,
    summary: {
      meshCount: meshCells.length,
      accessibleMeshCount: accessible.length,
      displayedStationCount: displayedStations.length,
      population2020,
      population2050,
      accessiblePopulation2020,
      accessiblePopulation2050,
      stationAccessShare2020:
        population2020 > 0
          ? round((accessiblePopulation2020 / population2020) * 100, 1)
          : 0,
      stationAccessShare2050:
        population2050 > 0
          ? round((accessiblePopulation2050 / population2050) * 100, 1)
          : 0,
    },
  };
}

function writeStationAccessDetails(
  generatedAt: string,
  meshes: readonly PopulationMeshPoint[],
  stations: readonly StationAccessPoint[],
  snapshot: GeoAnalysisSnapshot,
): Array<{
  readonly detail: GeoStationAccessPrefDetail;
  readonly evidence: GeoAnalysisArtifactEvidence;
}> {
  return fetchPrefectures().map((prefecture) => {
    const detail = stationAccessPrefDetail(
      generatedAt,
      prefecture.prefCode,
      prefecture.prefName,
      meshes,
      stations,
    );
    const aggregateRow = snapshot.rows.find(
      (row) => row.areaCode === prefecture.prefCode,
    );
    if (!aggregateRow) {
      throw new Error(`${prefecture.prefCode}: aggregate row欠落`);
    }
    assertStationAccessConservation(detail, aggregateRow);
    const prefCode2 = prefecture.prefCode.slice(0, 2);
    const evidence = writeJsonArtifact(
      geoStationAccessPrefKey(prefCode2),
      detail,
      detail.meshes.length,
      false,
      prefecture.prefCode,
    );
    if (evidence.bytes > MAX_GEO_DETAIL_BYTES) {
      throw new Error(
        `${prefecture.prefCode}: 県別Geo artifactが上限超過 bytes=${evidence.bytes}`,
      );
    }
    return { detail, evidence };
  });
}

async function loadPassengerContextEvidence(): Promise<PassengerContextEvidence> {
  const inputs: GeoAnalysisInputEvidence[] = [];
  const outputs: GeoAnalysisArtifactEvidence[] = [];
  for (const prefecture of fetchPrefectures()) {
    const prefCode2 = prefecture.prefCode.slice(0, 2);
    const key = `app/station-passengers/${prefCode2}/stations.json`;
    const { value, evidence } = await fetchJsonWithEvidence<unknown>(
      `${R2_PUBLIC_BASE}/${key}`,
      key,
    );
    if (
      typeof value !== "object" ||
      value === null ||
      !("stations" in value) ||
      !Array.isArray(value.stations)
    ) {
      throw new Error(`${key}: 駅別乗降客数contextのschema不良`);
    }
    inputs.push({
      layerId: "ksj-s12-passenger-context",
      datasetId: "S12",
      version: "2019-2023",
      key,
      sha256: evidence.sha256,
      bytes: evidence.bytes,
      geometry: "point",
      role: "context-only",
      usedInCalculation: false,
    });
    outputs.push({
      key,
      sha256: evidence.sha256,
      bytes: evidence.bytes,
      recordCount: value.stations.length,
      areaCode: prefecture.prefCode,
    });
  }
  return { inputs, outputs };
}

function stageOutputs<T>(
  details: readonly {
    readonly detail: T;
    readonly evidence: GeoAnalysisArtifactEvidence;
  }[],
  count: (detail: T) => number,
): GeoAnalysisArtifactEvidence[] {
  return details.map(({ detail, evidence }) => ({
    ...evidence,
    recordCount: count(detail),
  }));
}

function writeStationAccessManifest(input: {
  generatedAt: string;
  populationInputs: readonly GeoAnalysisInputEvidence[];
  stationInput: GeoAnalysisInputEvidence;
  passengerContext: PassengerContextEvidence;
  details: readonly {
    readonly detail: GeoStationAccessPrefDetail;
    readonly evidence: GeoAnalysisArtifactEvidence;
  }[];
  aggregate: GeoAnalysisArtifactEvidence;
  stationGroups: number;
  populatedMeshes: number;
}): GeoAnalysisEvidenceManifest {
  const definition = BUSINESS_PLAN_M1_GEO_ANALYSES.find(
    (analysis) => analysis.slug === "population-station-access",
  );
  if (!definition) throw new Error("station access analysis定義がありません");
  const populationOutputs = stageOutputs(input.details, (detail) => detail.meshes.length);
  const stationOutputs = stageOutputs(input.details, (detail) => detail.stations.length);
  const accessibleOutputs = stageOutputs(
    input.details,
    (detail) => detail.summary.accessibleMeshCount,
  );
  const manifest: GeoAnalysisEvidenceManifest = {
    schemaVersion: 1,
    slug: "population-station-access",
    generatedAt: input.generatedAt,
    definitionSha256: createHash("sha256")
      .update(JSON.stringify(definition))
      .digest("hex"),
    inputs: [
      ...input.populationInputs,
      input.stationInput,
      ...input.passengerContext.inputs,
    ],
    stages: [
      {
        id: "population-mesh",
        label: "1km将来人口メッシュ",
        kind: "source",
        role: "calculation-input",
        inputIds: ["ipss-population-mesh-1km"],
        operation: "2020年・2050年人口とメッシュ境界を県別表示artifactへ変換",
        outputKeyPattern: "app/geo/population-station-access/pref/{NN}.json#meshes",
        outputs: populationOutputs,
      },
      {
        id: "station-representative-points",
        label: "駅グループ代表点",
        kind: "spatial-operation",
        role: "derived",
        inputIds: ["ksj-s12-station-point"],
        operation: "駅グループコードで重複をまとめ線形状の代表点を算出",
        outputKeyPattern: "app/geo/population-station-access/pref/{NN}.json#stations",
        outputs: stationOutputs,
      },
      {
        id: "station-passenger-context",
        label: "駅別乗降客数",
        kind: "context",
        role: "context-only",
        inputIds: ["ksj-s12-passenger-context"],
        operation: "背景理解の補助表示。駅800m圏人口の計算には使用しない",
        outputKeyPattern: "app/station-passengers/{NN}/stations.json",
        outputs: input.passengerContext.outputs,
      },
      {
        id: "station-access-800m",
        label: "駅800m圏メッシュ",
        kind: "spatial-operation",
        role: "derived",
        inputIds: ["population-mesh", "station-representative-points"],
        operation: "メッシュ中心点と駅代表点の大円距離が800m以内か判定",
        outputKeyPattern: "app/geo/population-station-access/pref/{NN}.json#meshes[*][7]",
        outputs: accessibleOutputs,
      },
      {
        id: "prefecture-aggregate",
        label: "都道府県別集計",
        kind: "aggregate",
        role: "aggregate",
        inputIds: ["station-access-800m"],
        operation: "圏内メッシュの2020年・2050年人口を47都道府県別に合計",
        outputKeyPattern: "app/geo/population-station-access/item.json",
        outputs: [input.aggregate],
      },
    ],
    aggregate: input.aggregate,
    quality: {
      expectedAreas: 47,
      detailAreas: input.details.length,
      conservationChecks: input.details.length,
      sourceRecords:
        input.populatedMeshes +
        input.stationGroups +
        input.passengerContext.outputs.reduce(
          (sum, output) => sum + output.recordCount,
          0,
        ),
      derivedRecords: input.details.reduce(
        (sum, item) => sum + item.detail.summary.accessibleMeshCount,
        0,
      ),
      stationGroups: input.stationGroups,
      populatedMeshes: input.populatedMeshes,
      accessibleMeshes: input.details.reduce(
        (sum, item) => sum + item.detail.summary.accessibleMeshCount,
        0,
      ),
      maxDetailBytes: Math.max(...input.details.map((item) => item.evidence.bytes)),
    },
  };
  writeJsonArtifact(
    GEO_STATION_ACCESS_MANIFEST_KEY,
    manifest,
    manifest.stages.length,
    true,
  );
  return manifest;
}

function writeLandPriceDetails(input: {
  generatedAt: string;
  meshes: readonly PopulationMeshPoint[];
  points: readonly LandPriceDetailPointInput[];
  snapshot: GeoAnalysisSnapshot;
}): Array<{
  readonly detail: GeoLandPricePrefDetail;
  readonly evidence: GeoAnalysisArtifactEvidence;
}> {
  return fetchPrefectures().map((prefecture) => {
    const detail = buildLandPricePrefDetail({
      generatedAt: input.generatedAt,
      areaCode: prefecture.prefCode,
      areaName: prefecture.prefName,
      meshes: input.meshes,
      points: input.points,
    });
    const aggregateRow = input.snapshot.rows.find(
      (row) => row.areaCode === prefecture.prefCode,
    );
    if (!aggregateRow) throw new Error(`${prefecture.prefCode}: aggregate row欠落`);
    assertLandPriceConservation(detail, aggregateRow);
    const evidence = writeJsonArtifact(
      geoAnalysisPrefKey("population-land-price", prefecture.prefCode.slice(0, 2)),
      detail,
      detail.meshes.length + detail.landPricePoints.length,
      false,
      prefecture.prefCode,
    );
    if (evidence.bytes > MAX_GEO_DETAIL_BYTES) {
      throw new Error(`${prefecture.prefCode}: 地価detail上限超過 bytes=${evidence.bytes}`);
    }
    return { detail, evidence };
  });
}

function writeLandPriceManifest(input: {
  generatedAt: string;
  populationInputs: readonly GeoAnalysisInputEvidence[];
  landPriceInput: GeoAnalysisInputEvidence;
  details: readonly {
    readonly detail: GeoLandPricePrefDetail;
    readonly evidence: GeoAnalysisArtifactEvidence;
  }[];
  aggregate: GeoAnalysisArtifactEvidence;
}): GeoAnalysisEvidenceManifest {
  const definition = BUSINESS_PLAN_M1_GEO_ANALYSES.find(
    (analysis) => analysis.slug === "population-land-price",
  );
  if (!definition) throw new Error("land price analysis定義がありません");
  const manifest: GeoAnalysisEvidenceManifest = {
    schemaVersion: 1,
    slug: "population-land-price",
    generatedAt: input.generatedAt,
    definitionSha256: createHash("sha256")
      .update(JSON.stringify(definition))
      .digest("hex"),
    inputs: [...input.populationInputs, input.landPriceInput],
    stages: [
      {
        id: "population-mesh",
        label: "1km将来人口メッシュ",
        kind: "source",
        role: "calculation-input",
        inputIds: ["ipss-population-mesh-1km"],
        operation: "2020年・2050年人口とメッシュ境界を県別artifactへ変換",
        outputKeyPattern: "app/geo/population-land-price/pref/{NN}.json#meshes",
        outputs: stageOutputs(input.details, (detail) => detail.meshes.length),
      },
      {
        id: "residential-land-price-points",
        label: "住宅地の地価公示地点",
        kind: "source",
        role: "calculation-input",
        inputIds: ["ksj-l01-residential-land-price"],
        operation: "用途区分000の地点・価格・変動率を県別artifactへ変換",
        outputKeyPattern:
          "app/geo/population-land-price/pref/{NN}.json#landPricePoints",
        outputs: stageOutputs(
          input.details,
          (detail) => detail.landPricePoints.length,
        ),
      },
      {
        id: "prefecture-aggregate",
        label: "都道府県別集計",
        kind: "aggregate",
        role: "aggregate",
        inputIds: ["population-mesh", "residential-land-price-points"],
        operation: "人口合計と住宅地地点の中央値を同じ都道府県コードで結合",
        outputKeyPattern: "app/geo/population-land-price/item.json",
        outputs: [input.aggregate],
      },
    ],
    aggregate: input.aggregate,
    quality: {
      expectedAreas: 47,
      detailAreas: input.details.length,
      conservationChecks: input.details.length,
      sourceRecords: input.details.reduce(
        (sum, item) =>
          sum + item.detail.meshes.length + item.detail.landPricePoints.length,
        0,
      ),
      derivedRecords: input.details.length,
      populatedMeshes: input.details.reduce(
        (sum, item) => sum + item.detail.meshes.length,
        0,
      ),
      maxDetailBytes: Math.max(...input.details.map((item) => item.evidence.bytes)),
    },
  };
  writeJsonArtifact(
    geoAnalysisManifestKey(manifest.slug),
    manifest,
    manifest.stages.length,
    true,
  );
  return manifest;
}

function writeFloodDetails(input: {
  generatedAt: string;
  meshes: readonly PopulationMeshPoint[];
  snapshot: GeoAnalysisSnapshot;
}): Array<{
  readonly detail: GeoFloodPrefDetail;
  readonly evidence: GeoAnalysisArtifactEvidence;
}> {
  return fetchPrefectures().map((prefecture) => {
    const detail = buildFloodPrefDetail({
      generatedAt: input.generatedAt,
      areaCode: prefecture.prefCode,
      areaName: prefecture.prefName,
      meshes: input.meshes,
    });
    const aggregateRow = input.snapshot.rows.find(
      (row) => row.areaCode === prefecture.prefCode,
    );
    if (!aggregateRow) throw new Error(`${prefecture.prefCode}: aggregate row欠落`);
    assertFloodConservation(detail, aggregateRow);
    const evidence = writeJsonArtifact(
      geoAnalysisPrefKey("population-flood-risk", prefecture.prefCode.slice(0, 2)),
      detail,
      detail.meshes.length,
      false,
      prefecture.prefCode,
    );
    if (evidence.bytes > MAX_GEO_DETAIL_BYTES) {
      throw new Error(`${prefecture.prefCode}: 洪水detail上限超過 bytes=${evidence.bytes}`);
    }
    return { detail, evidence };
  });
}

function writeFloodManifest(input: {
  generatedAt: string;
  populationInputs: readonly GeoAnalysisInputEvidence[];
  floodInputs: readonly GeoAnalysisInputEvidence[];
  floodSourceOutputs: readonly GeoAnalysisArtifactEvidence[];
  details: readonly {
    readonly detail: GeoFloodPrefDetail;
    readonly evidence: GeoAnalysisArtifactEvidence;
  }[];
  aggregate: GeoAnalysisArtifactEvidence;
}): GeoAnalysisEvidenceManifest {
  const definition = BUSINESS_PLAN_M1_GEO_ANALYSES.find(
    (analysis) => analysis.slug === "population-flood-risk",
  );
  if (!definition) throw new Error("flood analysis定義がありません");
  const exposedMeshes = input.details.reduce(
    (sum, item) => sum + item.detail.summary.exposedMeshCount,
    0,
  );
  const manifest: GeoAnalysisEvidenceManifest = {
    schemaVersion: 1,
    slug: "population-flood-risk",
    generatedAt: input.generatedAt,
    definitionSha256: createHash("sha256")
      .update(JSON.stringify(definition))
      .digest("hex"),
    inputs: [...input.populationInputs, ...input.floodInputs],
    stages: [
      {
        id: "population-mesh",
        label: "1km将来人口メッシュ",
        kind: "source",
        role: "calculation-input",
        inputIds: ["ipss-population-mesh-1km"],
        operation: "2020年・2050年人口とメッシュ境界を県別artifactへ変換",
        outputKeyPattern: "app/geo/population-flood-risk/pref/{NN}.json#meshes",
        outputs: stageOutputs(input.details, (detail) => detail.meshes.length),
      },
      {
        id: "flood-maximum-polygons",
        label: "想定最大規模の洪水浸水想定区域",
        kind: "source",
        role: "calculation-input",
        inputIds: ["ksj-a31b-flood-polygon"],
        operation: "一次メッシュ別の公式GeoJSONを展開してポリゴンを検証",
        outputKeyPattern: "gis/mlit-ksj/A31b/25/source/{mesh}.zip",
        outputs: input.floodSourceOutputs,
      },
      {
        id: "flood-center-point-containment",
        label: "浸水想定区域内の人口メッシュ",
        kind: "spatial-operation",
        role: "derived",
        inputIds: ["population-mesh", "flood-maximum-polygons"],
        operation: "人口メッシュ中心点の洪水ポリゴン包含判定",
        outputKeyPattern:
          "app/geo/population-flood-risk/pref/{NN}.json#meshes[*][7]",
        outputs: stageOutputs(
          input.details,
          (detail) => detail.summary.exposedMeshCount,
        ),
      },
      {
        id: "prefecture-aggregate",
        label: "都道府県別集計",
        kind: "aggregate",
        role: "aggregate",
        inputIds: ["flood-center-point-containment"],
        operation: "区域内メッシュの2020年・2050年人口を47都道府県別に合計",
        outputKeyPattern: "app/geo/population-flood-risk/item.json",
        outputs: [input.aggregate],
      },
    ],
    aggregate: input.aggregate,
    quality: {
      expectedAreas: 47,
      detailAreas: input.details.length,
      conservationChecks: input.details.length,
      sourceRecords:
        input.details.reduce((sum, item) => sum + item.detail.meshes.length, 0) +
        input.floodSourceOutputs.reduce((sum, output) => sum + output.recordCount, 0),
      derivedRecords: exposedMeshes,
      populatedMeshes: input.details.reduce(
        (sum, item) => sum + item.detail.meshes.length,
        0,
      ),
      exposedMeshes,
      maxDetailBytes: Math.max(...input.details.map((item) => item.evidence.bytes)),
    },
  };
  writeJsonArtifact(
    geoAnalysisManifestKey(manifest.slug),
    manifest,
    manifest.stages.length,
    true,
  );
  return manifest;
}

function buildLandPriceSnapshot(
  generatedAt: string,
  accumulators: Map<string, AreaAccumulator>,
  acceptedPoints: number,
): GeoAnalysisSnapshot {
  const rows = fetchPrefectures().map((prefecture) => {
    const accumulator = accumulators.get(prefecture.prefCode);
    if (!accumulator || accumulator.residentialPrices.length === 0) {
      throw new Error(`住宅地の地価公示点がありません: ${prefecture.prefCode}`);
    }
    return {
      areaCode: prefecture.prefCode,
      areaName: prefecture.prefName,
      values: {
        medianResidentialLandPrice: round(median(accumulator.residentialPrices), 0),
        medianLandPriceChange: round(
          median(accumulator.residentialPriceChanges),
          1,
        ),
        populationChangeRate: populationChangeRate(accumulator),
        population2050: round(accumulator.population2050, 0),
        sampleCount: accumulator.residentialPrices.length,
      },
    };
  });
  return createSnapshot({
    slug: "population-land-price",
    generatedAt,
    title: "人口が減る県でも、住宅地の価格は同じように下がるのか",
    question: "2050年人口増減率と2026年住宅地の地価水準・変動率にはどんな地域差があるか",
    primaryMetricKey: "medianResidentialLandPrice",
    metrics: [
      { key: "medianResidentialLandPrice", label: "住宅地の地価中央値", unit: "円/㎡", format: "integer", description: "2026年地価公示の用途区分000（住宅地）の都道府県別中央値" },
      { key: "medianLandPriceChange", label: "対前年変動率中央値", unit: "%", format: "signedPercent1", description: "継続標準地を含む住宅地点の対前年変動率中央値" },
      { key: "populationChangeRate", label: "2050年人口増減率", unit: "%", format: "signedPercent1", description: "1kmメッシュ人口の2020年合計に対する2050年合計の増減率" },
      { key: "population2050", label: "2050年推計人口", unit: "人", format: "integer", description: "都道府県内1kmメッシュの2050年人口合計" },
      { key: "sampleCount", label: "住宅地標準地点数", unit: "地点", format: "integer", description: "中央値の計算に使用した住宅地の標準地点数" },
    ],
    rows,
    method: [
      "2026年地価公示の用途区分000（住宅地）だけを抽出し、都道府県別の中央値を計算した",
      "1kmメッシュの2020年人口と2050年推計人口を都道府県別に合計し、増減率を計算した",
      "地価は平均値ではなく中央値を使い、一部の非常に高い地点の影響を抑えた",
    ],
    sources: [
      commonPopulationSource(),
      {
        name: "国土交通省『地価公示（2026年）』",
        url: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L01-2026.html",
        datasetId: "L01",
        version: LAND_PRICE_VERSION,
        license: "CC BY 4.0",
      },
    ],
    caveats: [
      "地価公示は標準地の地点データであり、都道府県内すべての土地価格を代表するものではない",
      "人口変化と地価の関係は相関の観察であり、因果関係を示さない",
      "住宅地の構成や標準地点数が県ごとに異なるため、中央値と地点数を併記する",
    ],
    inputCounts: { residentialLandPricePoints: acceptedPoints },
    coverageNote: "47都道府県すべてで住宅地標準地点と人口メッシュを確認",
  });
}

function buildStationSnapshot(
  generatedAt: string,
  meshes: readonly PopulationMeshPoint[],
  stationCount: number,
): GeoAnalysisSnapshot {
  const rows = fetchPrefectures().map((prefecture) => {
    const areaMeshes = meshes.filter((mesh) => mesh.areaCode === prefecture.prefCode);
    const population2020 = areaMeshes.reduce((sum, mesh) => sum + mesh.population2020, 0);
    const population2050 = areaMeshes.reduce((sum, mesh) => sum + mesh.population2050, 0);
    const accessiblePopulation2020 = areaMeshes
      .filter((mesh) => mesh.isStationAccessible)
      .reduce((sum, mesh) => sum + mesh.population2020, 0);
    const accessiblePopulation2050 = areaMeshes
      .filter((mesh) => mesh.isStationAccessible)
      .reduce((sum, mesh) => sum + mesh.population2050, 0);
    return {
      areaCode: prefecture.prefCode,
      areaName: prefecture.prefName,
      values: {
        stationAccessShare2050:
          population2050 > 0
            ? round((accessiblePopulation2050 / population2050) * 100, 1)
            : 0,
        stationAccessShare2020:
          population2020 > 0
            ? round((accessiblePopulation2020 / population2020) * 100, 1)
            : 0,
        accessiblePopulation2050: round(accessiblePopulation2050, 0),
        populationChangeRate:
          population2020 > 0
            ? round(((population2050 - population2020) / population2020) * 100, 1)
            : 0,
        accessibleMeshCount: areaMeshes.filter((mesh) => mesh.isStationAccessible).length,
      },
    };
  });
  return createSnapshot({
    slug: "population-station-access",
    generatedAt,
    title: "2050年、駅の近くに住む人口はどれくらい残るのか",
    question: "鉄道駅から直線800m以内の1kmメッシュ人口は、2020年から2050年にどう変わるか",
    primaryMetricKey: "stationAccessShare2050",
    metrics: [
      { key: "stationAccessShare2050", label: "2050年駅800m圏人口比率", unit: "%", format: "percent1", description: "駅代表点から直線800m以内に中心がある1kmメッシュ人口の比率" },
      { key: "stationAccessShare2020", label: "2020年駅800m圏人口比率", unit: "%", format: "percent1", description: "同じ判定方法による2020年人口比率" },
      { key: "accessiblePopulation2050", label: "2050年駅800m圏人口", unit: "人", format: "integer", description: "駅800m圏と判定した1kmメッシュの2050年人口合計" },
      { key: "populationChangeRate", label: "2050年人口増減率", unit: "%", format: "signedPercent1", description: "都道府県内1kmメッシュ人口の2020年から2050年の増減率" },
      { key: "accessibleMeshCount", label: "駅800m圏メッシュ数", unit: "メッシュ", format: "integer", description: "中心点が駅代表点から直線800m以内にある人口メッシュ数" },
    ],
    rows,
    method: [
      "駅別乗降客数データの駅グループコードで重複をまとめ、各駅グループの線形状から代表点を計算した",
      "各1km人口メッシュの中心点から駅代表点までの大円距離を計算し、800m以内を駅アクセス圏とした",
      "アクセス圏メッシュの2020年人口・2050年人口を都道府県別に合計した",
    ],
    sources: [
      commonPopulationSource(),
      {
        name: "国土交通省『駅別乗降客数（2024年度、2025年度整備）』",
        url: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-S12-2024.html",
        datasetId: "S12",
        version: STATION_VERSION,
        license: "CC BY 4.0",
      },
    ],
    caveats: [
      "800mは直線距離であり、道路網・坂道・河川・踏切を考慮した徒歩経路ではない",
      "1kmメッシュ中心点による判定のため、メッシュ内部の人口分布を一様と仮定した近似である",
      "駅別乗降客数は事業者ごとに算出方法や公開範囲が異なるため、この分析では駅位置だけを使用した",
    ],
    inputCounts: { stationGroups: stationCount, populatedMeshes: meshes.length },
    coverageNote: "47都道府県の人口メッシュを全国の駅グループ代表点と同一条件で距離判定",
  });
}

function buildFloodSnapshot(
  generatedAt: string,
  meshes: readonly PopulationMeshPoint[],
  floodCounts: { files: number; features: number; matchedFeatures: number },
): GeoAnalysisSnapshot {
  const rows = fetchPrefectures().map((prefecture) => {
    const areaMeshes = meshes.filter((mesh) => mesh.areaCode === prefecture.prefCode);
    const population2020 = areaMeshes.reduce((sum, mesh) => sum + mesh.population2020, 0);
    const population2050 = areaMeshes.reduce((sum, mesh) => sum + mesh.population2050, 0);
    const exposedMeshes = areaMeshes.filter((mesh) => (mesh.floodDepthClass ?? 0) > 0);
    const exposedPopulation2020 = exposedMeshes.reduce(
      (sum, mesh) => sum + mesh.population2020,
      0,
    );
    const exposedPopulation2050 = exposedMeshes.reduce(
      (sum, mesh) => sum + mesh.population2050,
      0,
    );
    return {
      areaCode: prefecture.prefCode,
      areaName: prefecture.prefName,
      values: {
        floodExposureShare2050:
          population2050 > 0
            ? round((exposedPopulation2050 / population2050) * 100, 1)
            : 0,
        floodExposureShare2020:
          population2020 > 0
            ? round((exposedPopulation2020 / population2020) * 100, 1)
            : 0,
        exposedPopulation2050: round(exposedPopulation2050, 0),
        populationChangeRate:
          population2020 > 0
            ? round(((population2050 - population2020) / population2020) * 100, 1)
            : 0,
        exposedMeshCount: exposedMeshes.length,
      },
    };
  });
  return createSnapshot({
    slug: "population-flood-risk",
    generatedAt,
    title: "2050年、洪水浸水想定区域に暮らす人口はどれくらいか",
    question: "想定最大規模の洪水浸水想定区域と1km将来人口メッシュを重ねると、地域差はどう見えるか",
    primaryMetricKey: "floodExposureShare2050",
    metrics: [
      { key: "floodExposureShare2050", label: "2050年浸水想定区域人口比率", unit: "%", format: "percent1", description: "中心点が想定最大規模の浸水想定区域内にある1kmメッシュ人口の比率" },
      { key: "floodExposureShare2020", label: "2020年浸水想定区域人口比率", unit: "%", format: "percent1", description: "同じ空間判定による2020年人口比率" },
      { key: "exposedPopulation2050", label: "2050年浸水想定区域人口", unit: "人", format: "integer", description: "浸水想定区域内と判定した1kmメッシュの2050年人口合計" },
      { key: "populationChangeRate", label: "2050年人口増減率", unit: "%", format: "signedPercent1", description: "都道府県内1kmメッシュ人口の2020年から2050年の増減率" },
      { key: "exposedMeshCount", label: "浸水想定区域メッシュ数", unit: "メッシュ", format: "integer", description: "中心点が想定最大規模の浸水想定区域内にある人口メッシュ数" },
    ],
    rows,
    method: [
      "2025年度洪水浸水想定区域のうち想定最大規模レイヤだけを使用した",
      "1km人口メッシュの中心点が浸水深ポリゴン内に含まれるかを一次メッシュ単位で空間判定した",
      "区域内と判定したメッシュの2020年人口・2050年人口を都道府県別に合計した",
    ],
    sources: [
      commonPopulationSource(),
      {
        name: "国土交通省『洪水浸水想定区域（1次メッシュ単位、2025年度）』",
        url: FLOOD_PAGE,
        datasetId: "A31b",
        version: FLOOD_VERSION,
        license: "CC BY 4.0",
      },
    ],
    caveats: [
      "本分析は避難判断や個別地点の安全確認に使えない。必ず自治体と国の最新ハザードマップを確認する",
      "1kmメッシュ中心点による包含判定のため、区域と一部だけ重なるメッシュや内部の人口分布を精密には表さない",
      "河川管理者から資料提供を受けた範囲が対象であり、浸水区域外で洪水が起きないことを意味しない",
    ],
    inputCounts: {
      floodZipFiles: floodCounts.files,
      floodFeatures: floodCounts.features,
      matchedFloodFeatures: floodCounts.matchedFeatures,
      populatedMeshes: meshes.length,
    },
    coverageNote: "想定最大規模94ファイルと47都道府県の人口メッシュを一次メッシュ単位で照合",
  });
}

async function main(): Promise<void> {
  const stationAccessOnly = process.argv.includes("--station-access-only");
  const generatedAt = new Date().toISOString();
  console.log(`R2 input: ${R2_PUBLIC_BASE}`);
  const { meshes, inputs: populationInputs } = await loadPopulationMeshes();
  if (meshes.length < 100_000) {
    throw new Error(`人口メッシュ件数が少なすぎます: ${meshes.length}`);
  }

  let landPricePointCount = 0;
  if (!stationAccessOnly) {
    const accumulators = createAreaAccumulators(meshes);
    const landPrice = loadLandPricePoints(accumulators);
    landPricePointCount = landPrice.points.length;
    const landPriceSnapshot = buildLandPriceSnapshot(
      generatedAt,
      accumulators,
      landPricePointCount,
    );
    const landPriceAggregate = writeSnapshot(landPriceSnapshot);
    const landPriceDetails = writeLandPriceDetails({
      generatedAt,
      meshes,
      points: landPrice.points,
      snapshot: landPriceSnapshot,
    });
    writeLandPriceManifest({
      generatedAt,
      populationInputs,
      landPriceInput: landPrice.input,
      details: landPriceDetails,
      aggregate: landPriceAggregate,
    });
  }

  const { stations: stationPoints, input: stationInput } = loadStationPoints();
  if (stationPoints.length < 5_000) {
    throw new Error(`駅グループ数が少なすぎます: ${stationPoints.length}`);
  }
  const stationAccessMeshes = calculateStationAccessibility(meshes, stationPoints);
  const stationSnapshot = buildStationSnapshot(
    generatedAt,
    stationAccessMeshes,
    stationPoints.length,
  );
  const stationAggregate = writeSnapshot(stationSnapshot);
  const stationDetails = writeStationAccessDetails(
    generatedAt,
    stationAccessMeshes,
    stationPoints,
    stationSnapshot,
  );
  const passengerContext = await loadPassengerContextEvidence();
  const stationManifest = writeStationAccessManifest({
    generatedAt,
    populationInputs,
    stationInput,
    passengerContext,
    details: stationDetails,
    aggregate: stationAggregate,
    stationGroups: stationPoints.length,
    populatedMeshes: stationAccessMeshes.length,
  });

  if (stationAccessOnly) {
    console.log(
      `完了: meshes=${meshes.length} stations=${stationPoints.length} stationDetails=${stationManifest.quality.detailAreas}`,
    );
    return;
  }

  const floodCounts = await markFloodExposure(stationAccessMeshes);
  const floodSnapshot = buildFloodSnapshot(
    generatedAt,
    stationAccessMeshes,
    floodCounts,
  );
  const floodAggregate = writeSnapshot(floodSnapshot);
  const floodDetails = writeFloodDetails({
    generatedAt,
    meshes: stationAccessMeshes,
    snapshot: floodSnapshot,
  });
  writeFloodManifest({
    generatedAt,
    populationInputs,
    floodInputs: floodCounts.inputs,
    floodSourceOutputs: floodCounts.sourceOutputs,
    details: floodDetails,
    aggregate: floodAggregate,
  });

  console.log(
    `完了: meshes=${meshes.length} landPoints=${landPricePointCount} stations=${stationPoints.length} stationDetails=${stationManifest.quality.detailAreas} floodFiles=${floodCounts.files}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});

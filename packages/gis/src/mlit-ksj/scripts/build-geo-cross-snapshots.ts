#!/usr/bin/env tsx

import * as fs from "node:fs";
import { createHash } from "node:crypto";
import * as path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

import { fetchPrefectures } from "@stats47/area";
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
  coordinateBounds,
  geometryCenter,
  haversineKilometers,
  median,
  pointInMultiPolygon,
  rankAreaRows,
  round,
  type Coordinate,
  type PopulationMeshPoint,
} from "../../geo-analysis/geo-analysis-core";
import type {
  GeoAnalysisMetricDefinition,
  GeoAnalysisSnapshot,
  GeoAnalysisSnapshotRow,
  GeoAnalysisSource,
} from "../../geo-analysis/snapshot";

const R2_PUBLIC_BASE = (
  process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp"
).replace(/\/+$/, "");
const POPULATION_VERSION = "24";
const LAND_PRICE_VERSION = "26";
const STATION_VERSION = "25";
const FLOOD_VERSION = "25";
const ACCESS_RADIUS_KM = 0.8;
const STATION_GRID_DEGREES = 0.02;
const FLOOD_GRID_DEGREES = 0.01;
const EXPECTED_FLOOD_FILES = 94;
const OUTPUT_ROOT = path.resolve(".local/r2/app/geo");
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
  longitudeTotal: number;
  latitudeTotal: number;
  count: number;
}

interface StationPoint {
  readonly longitude: number;
  readonly latitude: number;
}

function assertOk(response: Response, url: string): Response {
  if (!response.ok) {
    throw new Error(`取得失敗: ${response.status} ${response.statusText} ${url}`);
  }
  return response;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = assertOk(
    await fetch(url, { headers: { "User-Agent": "stats47-geo-analysis/1.0" } }),
    url,
  );
  return (await response.json()) as T;
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

function polygonCenter(geometry: Geometry): Coordinate | null {
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
  return [(minLongitude + maxLongitude) / 2, (minLatitude + maxLatitude) / 2];
}

async function loadPopulationMeshes(): Promise<PopulationMeshPoint[]> {
  const records: PopulationMeshPoint[] = [];
  for (const [index, prefecture] of fetchPrefectures().entries()) {
    const prefCode = prefecture.prefCode.slice(0, 2);
    const url = `${R2_PUBLIC_BASE}/gis/mlit-ksj/mesh1000r6/${POPULATION_VERSION}/${prefCode}.topojson`;
    const topology = await fetchJson<Topology>(url);
    const features = topologyToFeatures(topology);
    for (const current of features) {
      const meshId = stringProperty(current.properties, "MESH_ID");
      const population2020 = numberProperty(current.properties, "PTN_2020") ?? 0;
      const population2050 = numberProperty(current.properties, "PTN_2050") ?? 0;
      if (!meshId || (population2020 <= 0 && population2050 <= 0)) continue;
      const center = current.geometry ? polygonCenter(current.geometry) : null;
      if (!center) continue;
      records.push({
        meshId,
        areaCode: prefecture.prefCode,
        longitude: center[0],
        latitude: center[1],
        population2020,
        population2050,
      });
    }
    console.log(
      `人口メッシュ ${index + 1}/47 ${prefecture.prefName}: ${features.length} features`,
    );
  }
  return records;
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
): number {
  const topology = readTopology(
    path.resolve(
      `.local/r2/gis/mlit-ksj/L01/${LAND_PRICE_VERSION}/national.topojson`,
    ),
  );
  const features = topologyToFeatures(topology);
  let accepted = 0;
  for (const current of features) {
    if (stringProperty(current.properties, "L01_002") !== "000") continue;
    const municipalityCode = stringProperty(current.properties, "L01_001");
    const price = numberProperty(current.properties, "L01_008");
    const priceChange = numberProperty(current.properties, "L01_009");
    if (!municipalityCode || price === null || price <= 0) continue;
    const accumulator = accumulators.get(`${municipalityCode.slice(0, 2)}000`);
    if (!accumulator) continue;
    accumulator.residentialPrices.push(price);
    if (priceChange !== null) accumulator.residentialPriceChanges.push(priceChange);
    accepted += 1;
  }
  return accepted;
}

function stationFeatureCenter(
  geometry: LineString | MultiLineString,
): Coordinate | null {
  const positions = flattenPositions(geometry);
  return geometryCenter(positions);
}

function loadStationPoints(): StationPoint[] {
  const topology = readTopology(
    path.resolve(
      `.local/r2/gis/mlit-ksj/S12/${STATION_VERSION}/national.topojson`,
    ),
  );
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
      longitudeTotal: 0,
      latitudeTotal: 0,
      count: 0,
    };
    groups.set(groupCode, {
      longitudeTotal: previous.longitudeTotal + center[0],
      latitudeTotal: previous.latitudeTotal + center[1],
      count: previous.count + 1,
    });
  }
  return [...groups.values()].map((group) => ({
    longitude: group.longitudeTotal / group.count,
    latitude: group.latitudeTotal / group.count,
  }));
}

function gridKey(longitude: number, latitude: number, size: number): string {
  return `${Math.floor(longitude / size)}:${Math.floor(latitude / size)}`;
}

function markStationAccessibility(
  meshes: readonly PopulationMeshPoint[],
  stations: readonly StationPoint[],
): void {
  const stationGrid = new Map<string, StationPoint[]>();
  for (const station of stations) {
    const key = gridKey(station.longitude, station.latitude, STATION_GRID_DEGREES);
    stationGrid.set(key, [...(stationGrid.get(key) ?? []), station]);
  }
  const neighborRadius = Math.ceil(
    ACCESS_RADIUS_KM / (111 * STATION_GRID_DEGREES),
  );
  for (const mesh of meshes) {
    const longitudeBin = Math.floor(mesh.longitude / STATION_GRID_DEGREES);
    const latitudeBin = Math.floor(mesh.latitude / STATION_GRID_DEGREES);
    let accessible = false;
    for (let x = -neighborRadius; x <= neighborRadius && !accessible; x += 1) {
      for (let y = -neighborRadius; y <= neighborRadius && !accessible; y += 1) {
        const candidates = stationGrid.get(
          `${longitudeBin + x}:${latitudeBin + y}`,
        );
        accessible =
          candidates?.some(
            (station) =>
              haversineKilometers(
                [mesh.longitude, mesh.latitude],
                [station.longitude, station.latitude],
              ) <= ACCESS_RADIUS_KM,
          ) ?? false;
      }
    }
    mesh.isStationAccessible = accessible;
  }
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
    const key = gridKey(mesh.longitude, mesh.latitude, FLOOD_GRID_DEGREES);
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
): Promise<{ files: number; features: number; matchedFeatures: number }> {
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
    const candidates = byFirstMesh.get(firstMesh) ?? [];
    if (candidates.length === 0) {
      console.log(`洪水 ${index + 1}/${urls.length} ${firstMesh}: 人口メッシュなし`);
      continue;
    }

    const archive = await unzipper.Open.file(zipPath);
    const entry = archive.files.find((current: { path: string }) =>
      current.path.endsWith(`A31b-20-25_20_${firstMesh}.geojson`),
    );
    if (!entry) throw new Error(`想定最大規模GeoJSONがありません: ${url}`);
    const collection = JSON.parse(
      (await entry.buffer()).toString("utf8"),
    ) as FeatureCollection<Polygon | MultiPolygon, NumericProperties>;
    featureCount += collection.features.length;
    matchedFeatureCount += applyFloodFeatures(collection, candidates);
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

function writeSnapshot(snapshot: GeoAnalysisSnapshot): string {
  const outputDirectory = path.join(OUTPUT_ROOT, snapshot.slug);
  fs.mkdirSync(outputDirectory, { recursive: true });
  const outputPath = path.join(outputDirectory, "item.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(`snapshot: ${outputPath}`);
  return outputPath;
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
  const generatedAt = new Date().toISOString();
  console.log(`R2 input: ${R2_PUBLIC_BASE}`);
  const meshes = await loadPopulationMeshes();
  if (meshes.length < 100_000) {
    throw new Error(`人口メッシュ件数が少なすぎます: ${meshes.length}`);
  }

  const accumulators = createAreaAccumulators(meshes);
  const landPricePointCount = loadLandPricePoints(accumulators);
  writeSnapshot(
    buildLandPriceSnapshot(generatedAt, accumulators, landPricePointCount),
  );

  const stationPoints = loadStationPoints();
  if (stationPoints.length < 5_000) {
    throw new Error(`駅グループ数が少なすぎます: ${stationPoints.length}`);
  }
  markStationAccessibility(meshes, stationPoints);
  writeSnapshot(buildStationSnapshot(generatedAt, meshes, stationPoints.length));

  const floodCounts = await markFloodExposure(meshes);
  writeSnapshot(buildFloodSnapshot(generatedAt, meshes, floodCounts));

  console.log(
    `完了: meshes=${meshes.length} landPoints=${landPricePointCount} stations=${stationPoints.length} floodFiles=${floodCounts.files}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});

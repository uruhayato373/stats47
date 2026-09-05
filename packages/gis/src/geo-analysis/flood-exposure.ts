import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
  Position,
} from 'geojson';
import {
  coordinateBounds,
  pointInMultiPolygon,
  type Coordinate,
  type PopulationMeshPoint,
} from './geo-analysis-core';

const FLOOD_GRID_DEGREES = 0.01;
type NumericProperties = Record<string, unknown>;

function floodPolygons(
  geometry: Polygon | MultiPolygon
): readonly (readonly (readonly Coordinate[])[])[] {
  const convertPolygon = (polygon: Position[][]): Coordinate[][] =>
    polygon.map((ring) =>
      ring.map((position) => [Number(position[0]), Number(position[1])])
    );
  if (geometry.type === 'Polygon') {
    return [convertPolygon(geometry.coordinates)];
  }
  return geometry.coordinates.map(convertPolygon);
}

function buildFloodMeshGrid(
  meshes: readonly PopulationMeshPoint[]
): Map<string, PopulationMeshPoint[]> {
  const result = new Map<string, PopulationMeshPoint[]>();
  for (const mesh of meshes) {
    const key = `${Math.floor(mesh.longitude / FLOOD_GRID_DEGREES)}:${Math.floor(
      mesh.latitude / FLOOD_GRID_DEGREES
    )}`;
    result.set(key, [...(result.get(key) ?? []), mesh]);
  }
  return result;
}

export function applyFloodFeatures(
  collection: FeatureCollection<Polygon | MultiPolygon, NumericProperties>,
  meshes: readonly PopulationMeshPoint[]
): number {
  const mark = createFloodFeatureMarker(meshes);
  return collection.features.reduce(
    (count, current) => count + Number(mark(current)),
    0
  );
}

/** 同じmesh配列へ複数河川区分を適用し、包含の和集合だけを保持する。 */
export function createFloodFeatureMarker(
  meshes: readonly PopulationMeshPoint[]
) {
  const meshGrid = buildFloodMeshGrid(meshes);
  return (
    current: Feature<Polygon | MultiPolygon, NumericProperties>
  ): boolean => {
    const polygons = floodPolygons(current.geometry);
    const bounds = coordinateBounds(polygons);
    if (!bounds) return false;
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
          if (pointInMultiPolygon([mesh.longitude, mesh.latitude], polygons)) {
            mesh.floodDepthClass = Math.max(
              mesh.floodDepthClass ?? 0,
              depthClass
            );
            featureMatched = true;
          }
        }
      }
    }
    return featureMatched;
  };
}

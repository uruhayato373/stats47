export type Coordinate = readonly [number, number];

export interface PopulationMeshPoint {
  readonly meshId: string;
  readonly areaCode: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly population2020: number;
  readonly population2050: number;
  readonly bounds?: readonly [west: number, south: number, east: number, north: number];
  floodDepthClass?: number;
  isStationAccessible?: boolean;
}

/** 8桁の第3次地域区画コードから約1kmメッシュ境界を復元する。 */
export function mesh1000BoundsFromCode(
  meshCode: string,
): readonly [west: number, south: number, east: number, north: number] | null {
  if (!/^\d{8}$/.test(meshCode)) return null;
  const latitudeBand = Number(meshCode.slice(0, 2));
  const longitudeBand = Number(meshCode.slice(2, 4));
  const latitudeSecond = Number(meshCode[4]);
  const longitudeSecond = Number(meshCode[5]);
  const latitudeThird = Number(meshCode[6]);
  const longitudeThird = Number(meshCode[7]);
  const south =
    latitudeBand / 1.5 +
    latitudeSecond * (2 / 3 / 8) +
    latitudeThird * (2 / 3 / 8 / 10);
  const west =
    100 +
    longitudeBand +
    longitudeSecond * (1 / 8) +
    longitudeThird * (1 / 8 / 10);
  return [west, south, west + 1 / 80, south + 1 / 120];
}

export interface RankedAreaRow {
  readonly areaCode: string;
  readonly areaName: string;
  readonly rank: number;
  readonly values: Readonly<Record<string, number | null>>;
}

export function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

export function rankAreaRows(
  rows: readonly Omit<RankedAreaRow, "rank">[],
  primaryMetricKey: string,
): RankedAreaRow[] {
  const sorted = [...rows].sort((a, b) => {
    const aValue = a.values[primaryMetricKey];
    const bValue = b.values[primaryMetricKey];
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    return bValue - aValue || a.areaCode.localeCompare(b.areaCode);
  });

  let previousValue: number | null | undefined;
  let previousRank = 0;
  return sorted.map((row, index) => {
    const value = row.values[primaryMetricKey];
    const rank = value === previousValue ? previousRank : index + 1;
    previousValue = value;
    previousRank = rank;
    return { ...row, rank };
  });
}

export function haversineKilometers(a: Coordinate, b: Coordinate): number {
  const earthRadiusKm = 6371.0088;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(b[1] - a[1]);
  const longitudeDelta = toRadians(b[0] - a[0]);
  const latitudeA = toRadians(a[1]);
  const latitudeB = toRadians(b[1]);
  const h =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) *
      Math.cos(latitudeB) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function pointInRing(point: Coordinate, ring: readonly Coordinate[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const current = ring[i];
    const previous = ring[j];
    if (!current || !previous) continue;
    const intersects =
      current[1] > point[1] !== previous[1] > point[1] &&
      point[0] <
        ((previous[0] - current[0]) * (point[1] - current[1])) /
          (previous[1] - current[1]) +
          current[0];
    if (intersects) inside = !inside;
  }
  return inside;
}

export function pointInPolygon(
  point: Coordinate,
  polygon: readonly (readonly Coordinate[])[],
): boolean {
  const exterior = polygon[0];
  if (!exterior || !pointInRing(point, exterior)) return false;
  return polygon.slice(1).every((hole) => !pointInRing(point, hole));
}

export function pointInMultiPolygon(
  point: Coordinate,
  polygons: readonly (readonly (readonly Coordinate[])[])[],
): boolean {
  return polygons.some((polygon) => pointInPolygon(point, polygon));
}

export function coordinateBounds(
  polygons: readonly (readonly (readonly Coordinate[])[])[],
): readonly [number, number, number, number] | null {
  let minLongitude = Number.POSITIVE_INFINITY;
  let minLatitude = Number.POSITIVE_INFINITY;
  let maxLongitude = Number.NEGATIVE_INFINITY;
  let maxLatitude = Number.NEGATIVE_INFINITY;

  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (const [longitude, latitude] of ring) {
        minLongitude = Math.min(minLongitude, longitude);
        minLatitude = Math.min(minLatitude, latitude);
        maxLongitude = Math.max(maxLongitude, longitude);
        maxLatitude = Math.max(maxLatitude, latitude);
      }
    }
  }

  if (!Number.isFinite(minLongitude)) return null;
  return [minLongitude, minLatitude, maxLongitude, maxLatitude];
}

export function geometryCenter(
  coordinates: readonly Coordinate[],
): Coordinate | null {
  if (coordinates.length === 0) return null;
  const total = coordinates.reduce(
    (sum, coordinate) => [sum[0] + coordinate[0], sum[1] + coordinate[1]] as const,
    [0, 0] as const,
  );
  return [total[0] / coordinates.length, total[1] / coordinates.length];
}

import { mesh1000BoundsFromCode } from './geo-analysis-core';
import type {
  GeoAnalysisSnapshotRow,
  GeoPublicFacilityPrefDetail,
  GeoPublicFacilityPoint,
  GeoPublicFacilityMesh,
  GeoPublicFacilityBandSummary,
} from './snapshot';

export const PUBLIC_FACILITY_GROUPS = ['administrative', 'meeting'] as const;
export const PUBLIC_FACILITY_BANDS = [
  { id: '0-500m', maxMeters: 500 },
  { id: '500-1000m', maxMeters: 1000 },
  { id: '1000-3000m', maxMeters: 3000 },
  { id: '3000-5000m', maxMeters: 5000 },
  { id: 'over-5000m', maxMeters: null },
] as const;
const EARTH_RADIUS_METERS = 6371008.8;
const radians = (degrees: number) => (degrees * Math.PI) / 180;
function ensure(condition: unknown, reason: string): asserts condition {
  if (!condition) throw new Error(`Public facility access: ${reason}`);
}
function close(
  actual: number,
  expected: number,
  label: string,
  tolerance = 1e-5
) {
  ensure(
    Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    label
  );
}
export function publicFacilityDistanceBand(meters: number): number {
  ensure(Number.isFinite(meters) && meters >= 0, 'invalid distance');
  return PUBLIC_FACILITY_BANDS.findIndex(
    (b) => b.maxMeters === null || meters <= b.maxMeters + 1e-7
  );
}
export function publicFacilityDistanceMeters(
  a: readonly number[],
  b: readonly number[]
): number {
  const h =
    Math.sin(radians(b[1] - a[1]) / 2) ** 2 +
    Math.cos(radians(a[1])) *
      Math.cos(radians(b[1])) *
      Math.sin(radians(b[0] - a[0]) / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.min(1, h)));
}
function xyz(lon: number, lat: number): readonly number[] {
  const phi = radians(lat),
    lambda = radians(lon);
  return [
    Math.cos(phi) * Math.cos(lambda),
    Math.cos(phi) * Math.sin(lambda),
    Math.sin(phi),
  ];
}
interface IndexedPoint {
  point: GeoPublicFacilityPoint;
  xyz: readonly number[];
}
interface Tree {
  point: IndexedPoint;
  axis: number;
  left: Tree | null;
  right: Tree | null;
}
function tree(points: readonly IndexedPoint[], depth = 0): Tree | null {
  if (!points.length) return null;
  const axis = depth % 3,
    sorted = [...points].sort(
      (a, b) =>
        a.xyz[axis] - b.xyz[axis] || a.point[1].localeCompare(b.point[1])
    ),
    mid = sorted.length >> 1;
  return {
    point: sorted[mid],
    axis,
    left: tree(sorted.slice(0, mid), depth + 1),
    right: tree(sorted.slice(mid + 1), depth + 1),
  };
}
export function publicFacilityGroup(
  point: GeoPublicFacilityPoint
): 'administrative' | 'meeting' {
  return ['1', '2', '3'].includes(point[3]) ? 'administrative' : 'meeting';
}
export function validatePublicFacilityPoints(
  points: readonly GeoPublicFacilityPoint[]
): void {
  const indices = new Set<number>(),
    ids = new Set<string>();
  for (const point of points) {
    ensure(
      Array.isArray(point) &&
        point.length === 7 &&
        Number.isInteger(point[0]) &&
        point[0] >= 0 &&
        !indices.has(point[0]) &&
        !ids.has(point[1]),
      'duplicate/invalid facility identity'
    );
    ensure(
      typeof point[1] === 'string' &&
        /^P05-22:\d{2}:\d+$/.test(point[1]) &&
        typeof point[2] === 'string' &&
        /^\d{5}$/.test(point[2]) &&
        point[1].split(':')[1] === point[2].slice(0, 2),
      'facility location identity'
    );
    ensure(
      ['1', '2', '3', '4', '5'].includes(point[3]) &&
        typeof point[4] === 'string' &&
        point[4].length > 0,
      'facility definition'
    );
    ensure(
      Number.isFinite(point[5]) &&
        point[5] >= 122 &&
        point[5] <= 154 &&
        Number.isFinite(point[6]) &&
        point[6] >= 20 &&
        point[6] <= 47,
      'facility coordinates'
    );
    indices.add(point[0]);
    ids.add(point[1]);
  }
}
/** A national index keeps facilities across prefecture boundaries in the nearest search. */
export function createPublicFacilitySearch(
  points: readonly GeoPublicFacilityPoint[]
) {
  validatePublicFacilityPoints(points);
  const trees = Object.fromEntries(
    PUBLIC_FACILITY_GROUPS.map((group) => [
      group,
      tree(
        points
          .filter((p) => publicFacilityGroup(p) === group)
          .map((point) => ({ point, xyz: xyz(point[5], point[6]) }))
      ),
    ])
  ) as Record<'administrative' | 'meeting', Tree | null>;
  ensure(trees.administrative && trees.meeting, 'missing facility group');
  return (
    longitude: number,
    latitude: number,
    group: 'administrative' | 'meeting'
  ) => {
    const target = xyz(longitude, latitude);
    let best: IndexedPoint | null = null,
      bestDistance = Infinity;
    function search(node: Tree | null): void {
      if (!node) return;
      const distance = node.point.xyz.reduce(
        (sum, value, i) => sum + (value - target[i]) ** 2,
        0
      );
      if (
        distance < bestDistance ||
        (distance === bestDistance &&
          (!best || node.point.point[1] < best.point[1]))
      ) {
        best = node.point;
        bestDistance = distance;
      }
      const difference = target[node.axis] - node.point.xyz[node.axis];
      search(difference <= 0 ? node.left : node.right);
      if (difference * difference <= bestDistance)
        search(difference <= 0 ? node.right : node.left);
    }
    search(trees[group]);
    ensure(best, 'nearest facility absent');
    const point = (best as IndexedPoint).point;
    const distanceMeters = publicFacilityDistanceMeters(
      [longitude, latitude],
      [point[5], point[6]]
    );
    return {
      point,
      distanceMeters,
      bandIndex: publicFacilityDistanceBand(distanceMeters),
    };
  };
}
export function summarizePublicFacilityMeshes(
  meshes: readonly GeoPublicFacilityMesh[],
  facilities: readonly GeoPublicFacilityPoint[],
  areaCode: string
) {
  const byIndex = new Map(facilities.map((p) => [p[0], p]));
  const summary = Object.fromEntries(
    PUBLIC_FACILITY_GROUPS.map((group) => [
      group,
      PUBLIC_FACILITY_BANDS.map((band) => ({
        band: band.id,
        meshCount: 0,
        population2020: 0,
        population2050: 0,
        crossPrefNearest: 0,
      })),
    ])
  ) as Record<'administrative' | 'meeting', GeoPublicFacilityBandSummary[]>;
  for (const mesh of meshes)
    for (const [group, offset] of [
      ['administrative', 5],
      ['meeting', 8],
    ] as const) {
      const point = byIndex.get(mesh[offset] as number),
        band = summary[group][mesh[offset + 2] as number];
      ensure(point && band, 'unknown nearest facility/band');
      band.meshCount++;
      band.population2020 += mesh[3];
      band.population2050 += mesh[4];
      if (!point[2].startsWith(areaCode.slice(0, 2))) band.crossPrefNearest++;
    }
  return summary;
}
export function publicFacilityAggregateValues(
  detail: GeoPublicFacilityPrefDetail
): Record<string, number> {
  const population2020 = detail.meshes.reduce((sum, m) => sum + m[3], 0),
    population2050 = detail.meshes.reduce((sum, m) => sum + m[4], 0);
  ensure(
    population2020 > 0 && population2050 > 0,
    'zero population denominator'
  );
  const values: Record<string, number> = {
    population2020,
    population2050,
    meshCount: detail.meshes.length,
  };
  for (const group of PUBLIC_FACILITY_GROUPS) {
    values[`${group}FacilityCount`] = detail.facilities.filter(
      (p) =>
        p[2].startsWith(detail.areaCode.slice(0, 2)) &&
        publicFacilityGroup(p) === group
    ).length;
    for (const year of [2020, 2050] as const) {
      const denominator = year === 2020 ? population2020 : population2050;
      detail.summary[group].forEach((band, index) => {
        const population = band[`population${year}`];
        values[`${group}Band${index}Population${year}`] = population;
        values[`${group}Band${index}Share${year}`] =
          (population / denominator) * 100;
      });
      const within =
        detail.summary[group][0][`population${year}`] +
        detail.summary[group][1][`population${year}`];
      values[`${group}Within1000mPopulation${year}`] = within;
      values[`${group}Within1000mShare${year}`] = (within / denominator) * 100;
    }
  }
  return values;
}
export function assertPublicFacilityConservation(
  detail: GeoPublicFacilityPrefDetail,
  row?: GeoAnalysisSnapshotRow
): void {
  const summary = summarizePublicFacilityMeshes(
    detail.meshes,
    detail.facilities,
    detail.areaCode
  );
  for (const group of PUBLIC_FACILITY_GROUPS) {
    ensure(detail.summary[group]?.length === 5, 'summary bands incomplete');
    summary[group].forEach((expected, i) => {
      const actual = detail.summary[group][i];
      ensure(actual.band === expected.band, 'wrong band order');
      for (const key of [
        'meshCount',
        'population2020',
        'population2050',
        'crossPrefNearest',
      ] as const)
        close(actual[key], expected[key], `${group}/${i}/${key}`);
    });
  }
  if (row) {
    ensure(
      row.areaCode === detail.areaCode && row.areaName === detail.areaName,
      'aggregate area identity'
    );
    const values = publicFacilityAggregateValues(detail);
    for (const [key, value] of Object.entries(values))
      close(Number(row.values[key]), value, `aggregate ${key}`);
  }
}
export function validatePublicFacilityDetail(
  detail: GeoPublicFacilityPrefDetail
): void {
  ensure(
    detail?.schemaVersion === 1 &&
      detail.slug === 'population-public-facility-access' &&
      Number.isFinite(Date.parse(detail.generatedAt)),
    'detail version/identity'
  );
  ensure(
    typeof detail.areaCode === 'string' &&
      /^(0[1-9]|[1-3][0-9]|4[0-7])000$/.test(detail.areaCode) &&
      typeof detail.areaName === 'string' &&
      detail.areaName.length > 0,
    'detail area'
  );
  ensure(
    Array.isArray(detail.facilities) &&
      Array.isArray(detail.meshes) &&
      detail.meshes.length > 0 &&
      detail.summary,
    'missing detail collections'
  );
  ensure(
    Array.isArray(detail.bands) &&
      detail.bands.length === 5 &&
      detail.bands.every(
        (b, i) =>
          b.id === PUBLIC_FACILITY_BANDS[i].id &&
          b.maxMeters === PUBLIC_FACILITY_BANDS[i].maxMeters
      ),
    'distance band definition'
  );
  validatePublicFacilityPoints(detail.facilities);
  const points = new Map(detail.facilities.map((p) => [p[0], p])),
    ids = new Set<string>();
  const nearest = createPublicFacilitySearch(detail.facilities);
  for (const mesh of detail.meshes) {
    ensure(
      Array.isArray(mesh) &&
        mesh.length === 11 &&
        typeof mesh[0] === 'string' &&
        !ids.has(mesh[0]) &&
        mesh
          .slice(1)
          .every(
            (value) => typeof value === 'number' && Number.isFinite(value)
          ),
      'invalid/duplicate mesh'
    );
    ids.add(mesh[0]);
    const bounds = mesh1000BoundsFromCode(mesh[0]);
    ensure(bounds, 'invalid mesh code');
    close(
      mesh[1],
      (Math.round(bounds[0] * 1e6) + Math.round(bounds[2] * 1e6)) / 2e6,
      'mesh longitude',
      1e-9
    );
    close(
      mesh[2],
      (Math.round(bounds[1] * 1e6) + Math.round(bounds[3] * 1e6)) / 2e6,
      'mesh latitude',
      1e-9
    );
    ensure(
      mesh[3] >= 0 && mesh[4] >= 0 && mesh[3] + mesh[4] > 0,
      'invalid population'
    );
    for (const [group, offset] of [
      ['administrative', 5],
      ['meeting', 8],
    ] as const) {
      const point = points.get(mesh[offset] as number);
      ensure(
        point && publicFacilityGroup(point) === group,
        'nearest facility group'
      );
      ensure(
        nearest(mesh[1], mesh[2], group).point[1] === point[1],
        'not the nearest available facility'
      );
      const distance = publicFacilityDistanceMeters(
        [mesh[1], mesh[2]],
        [point[5], point[6]]
      );
      close(
        mesh[offset + 1] as number,
        distance,
        'distance differs from points'
      );
      ensure(
        mesh[offset + 2] === publicFacilityDistanceBand(distance),
        'distance band differs'
      );
    }
  }
  assertPublicFacilityConservation(detail);
}

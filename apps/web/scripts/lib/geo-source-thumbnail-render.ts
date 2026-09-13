import { geoMercator, geoPath, geoTransform } from 'd3-geo';

import type { GeoThumbnailExtent } from '../../src/features/geo-analysis/lib/geo-source-thumbnail';
import type { Feature, Geometry, Position } from 'geojson';

export function geometryExtent(geometry: Geometry): GeoThumbnailExtent {
  const bounds: [number, number, number, number] = [
    Infinity,
    Infinity,
    -Infinity,
    -Infinity,
  ];
  const visit = (
    coordinates: Position | Position[] | Position[][] | Position[][][]
  ) => {
    if (typeof coordinates[0] === 'number') {
      const [x, y] = coordinates as Position;
      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        Math.abs(x) > 180 ||
        Math.abs(y) >= 90
      )
        throw new Error('Invalid GIS coordinates');
      bounds[0] = Math.min(bounds[0], x);
      bounds[1] = Math.min(bounds[1], y);
      bounds[2] = Math.max(bounds[2], x);
      bounds[3] = Math.max(bounds[3], y);
    } else for (const child of coordinates) visit(child as Position);
  };
  if (geometry.type === 'GeometryCollection') {
    for (const child of geometry.geometries) {
      const b = geometryExtent(child);
      visit([b[0], b[1]]);
      visit([b[2], b[3]]);
    }
  } else visit(geometry.coordinates);
  return bounds;
}

export function intersectsExtent(a: GeoThumbnailExtent, b: GeoThumbnailExtent) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

export function featureExtent(features: Feature[]): GeoThumbnailExtent {
  const bounds = features.map((f) => geometryExtent(f.geometry));
  const result: GeoThumbnailExtent = [
    Math.min(...bounds.map((b) => b[0])),
    Math.min(...bounds.map((b) => b[1])),
    Math.max(...bounds.map((b) => b[2])),
    Math.max(...bounds.map((b) => b[3])),
  ];
  if (!result.every(Number.isFinite))
    throw new Error('Empty geographic extent');
  // A point or a short line still needs a geographic frame.
  return [
    result[0] - 0.002,
    result[1] - 0.002,
    result[2] + 0.002,
    result[3] + 0.002,
  ];
}

const elevationColors = ['#d5e9d3', '#a5c99a', '#6f9c7f', '#64776a', '#715944'];
const landUseColors: Record<string, string> = {
  '0100': '#bdd789',
  '0200': '#e0dc9a',
  '0500': '#56866c',
  '0600': '#b9b599',
  '0700': '#c5786b',
  '0901': '#9892aa',
  '0902': '#9892aa',
  '1000': '#c2b5ad',
  '1100': '#80b6cc',
  '1400': '#e3d5ac',
  '1500': '#b4dbe5',
  '1600': '#88af76',
};
const landUseFields = [
  '田',
  'その他の農用地',
  '森林',
  '荒地',
  '建物用地',
  '道路',
  '鉄道',
  'その他の用地',
  '河川地及び湖沼',
  '海浜',
  '海水域',
  'ゴルフ場',
];
const landUseCodes = [
  '0100',
  '0200',
  '0500',
  '0600',
  '0700',
  '0901',
  '0902',
  '1000',
  '1100',
  '1400',
  '1500',
  '1600',
];

export function thumbnailColor(feature: Feature, dataId: string) {
  if (/^G04-[acd]$/.test(dataId)) {
    const value = feature.properties?.[`G04${dataId.slice(-1)}_002`];
    if (
      value === null ||
      value === undefined ||
      value === '' ||
      !Number.isFinite(Number(value)) ||
      Number(value) < -500
    )
      return '#d1d5db';
    return elevationColors[
      [50, 200, 500, 1000].filter((edge) => Number(value) >= edge).length
    ];
  }
  if (dataId === 'L03-a') {
    const areas = landUseFields.map((field) =>
      Number(feature.properties?.[field] ?? 0)
    );
    const largest = Math.max(...areas);
    return largest > 0
      ? landUseColors[landUseCodes[areas.indexOf(largest)]]
      : '#d1d5db';
  }
  if (dataId.startsWith('L03-b'))
    return (
      landUseColors[
        String(feature.properties?.['土地利用種別']).padStart(4, '0')
      ] ?? '#d1d5db'
    );
  return '#2879a2';
}

/** Planar Mercator path streaming preserves the source rings, including their holes.
 * No spherical winding assumptions, invented tiles, decimation, or feature sampling. */
export function renderGeoSourceThumbnail(options: {
  dataId: string;
  features: Feature[];
  context: Feature[];
  extent: GeoThumbnailExtent;
  width: number;
  height: number;
  mesh: boolean;
}) {
  const { dataId, features, context, extent, width, height, mesh } = options;
  const mercatorY = (lat: number) =>
    Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const left = (extent[0] * Math.PI) / 180,
    right = (extent[2] * Math.PI) / 180;
  const bottom = mercatorY(extent[1]),
    top = mercatorY(extent[3]);
  const padding = width * 0.035;
  const scale = Math.min(
    (width - padding * 2) / (right - left),
    (height - padding * 2) / (top - bottom)
  );
  const projection = geoTransform({
    point(x, y) {
      this.stream.point(
        width / 2 + ((x * Math.PI) / 180 - (left + right) / 2) * scale,
        height / 2 - (mercatorY(y) - (top + bottom) / 2) * scale
      );
    },
  });
  const path = geoPath(projection)
    .digits(2)
    .pointRadius(width >= 640 ? 1.8 : 1.05);
  // Maritime routes can cross ±180°. Split there before projection so an
  // overseas segment cannot become a spurious straight line across Japan.
  const linePath = geoPath(
    geoMercator()
      .scale(scale)
      .translate([
        width / 2 - ((left + right) / 2) * scale,
        height / 2 + ((top + bottom) / 2) * scale,
      ])
      .precision(0)
      .clipExtent([
        [0, 0],
        [width, height],
      ])
  ).digits(2);
  const selected = features.filter((f) =>
    intersectsExtent(geometryExtent(f.geometry), extent)
  );
  if (!selected.length)
    throw new Error(`${dataId}: no features in thumbnail extent`);
  const cell = geometryExtent(selected[0].geometry);
  const cellPixels = Math.min(
    (((cell[2] - cell[0]) * Math.PI) / 180) * scale,
    (mercatorY(cell[3]) - mercatorY(cell[1])) * scale
  );
  const groups = new Map<string, string[]>();
  for (const f of selected) {
    const color = thumbnailColor(f, dataId);
    const kind = /Polygon/.test(f.geometry.type)
      ? 'polygon'
      : /Line/.test(f.geometry.type)
        ? 'line'
        : 'point';
    const key = `${kind}:${color}`;
    const paths = groups.get(key) ?? [];
    paths.push((kind === 'line' ? linePath(f) : path(f)) ?? '');
    groups.set(key, paths);
  }
  const base = context
    .filter((f) => intersectsExtent(geometryExtent(f.geometry), extent))
    .map((f) => path(f))
    .join('');
  const layers = [...groups]
    .map(([key, paths]) => {
      const [kind, color] = key.split(':');
      const fill = kind === 'line' ? 'none' : color;
      const stroke =
        kind === 'point'
          ? '#ffffff'
          : kind === 'polygon' &&
              (mesh || ['N03', 'A38', 'A09'].includes(dataId))
            ? '#ffffff'
            : color;
      const strokeWidth =
        kind === 'point'
          ? 0.35
          : kind === 'polygon' && mesh
            ? cellPixels >= 2
              ? 0.16
              : 0
            : kind === 'line'
              ? width >= 640
                ? 2
                : 1.2
              : 0.55;
      // Separate paths avoid cancelling overlapping polygons under evenodd fill.
      return paths
        .map(
          (d) =>
            `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" fill-rule="evenodd"/>`
        )
        .join('');
    })
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><clipPath id="frame"><rect width="${width}" height="${height}"/></clipPath></defs><rect width="${width}" height="${height}" fill="#edf4f7"/><g clip-path="url(#frame)"><path d="${base}" fill="#e2e8e8" stroke="#fafcfc" stroke-width="1" fill-rule="evenodd"/>${layers}</g></svg>`;
  return { svg, visibleFeatures: selected.length };
}

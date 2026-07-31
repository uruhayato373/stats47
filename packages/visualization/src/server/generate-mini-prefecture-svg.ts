import { DEFAULT_SEQUENTIAL_SCHEME, d3KeyOfColorScheme } from '@stats47/types';
import { geoCentroid, geoMercator, type GeoProjection } from 'd3-geo';
import * as d3chromatic from 'd3-scale-chromatic';
import { feature } from 'topojson-client';
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';

import prefectureTopology from './prefecture-topology.generated.json';

/**
 * 配色を解決する。語彙とd3の実名は `@stats47/types` のカタログが SSOT (2026-07-31)。
 *
 * ★旧実装は手書きの 9 種だけを import しており、カタログ 46 種のうち **35 種が
 * 黙って青に落ちていた** (OGP / サムネ)。例外も警告も出ないので誰も気づかない。
 * 名前空間 import + カタログ照合にして、未知の値だけが既定にフォールバックする形にする。
 */
function resolveInterpolator(colorScheme?: string): (t: number) => string {
  const d3Key = d3KeyOfColorScheme(colorScheme) ?? DEFAULT_SEQUENTIAL_SCHEME;
  const fn = (d3chromatic as unknown as Record<string, unknown>)[d3Key];
  if (typeof fn === 'function') {
    const probe = (fn as (t: number) => unknown)(0.5);
    if (typeof probe === 'string') return fn as (t: number) => string;
  }
  return d3chromatic.interpolateBlues;
}

const WIDTH = 320;
const HEIGHT = 190;
const MAP_PADDING = 4;
const OVERVIEW_MAINLAND_LEFT = 48;
const OVERVIEW_OKINAWA_INSET = {
  x: 4,
  y: 130,
  width: 56,
  height: 56,
} as const;
export const MINI_PREFECTURE_THUMBNAIL_LAYOUT = {
  mainlandClockwiseRotationDegrees: 32,
  okinawa: 'excluded',
} as const;
/**
 * mini map の path 表現バージョン。snapshot に焼かれた SVG が未圧縮の旧世代か
 * どうかを消費側 (home featured) が判定するための非表示 marker。
 * 表現を非互換に変えるときだけ番号を上げる。
 */
export const MINI_PREFECTURE_MAP_FORMAT = 'compact-v1';
const T_MIN = 0.18;
const T_MAX = 0.95;
const NO_DATA_COLOR = '#e5e7eb';
const TOP_RING_COLOR = '#f59e0b';
const OVERVIEW_REGION_OPACITY = [
  0.24, 0.3, 0.38, 0.46, 0.54, 0.42, 0.34, 0.5, 0.58,
] as const;
/**
 * 投影後の座標系での簡略化許容誤差 (px)。320×190 の表示サイズでは視認できない。
 * overview と mini thumbnail の両方が共有する。
 */
const PROJECTED_PATH_TOLERANCE = 0.6;

type ScreenPoint = readonly [number, number];

let prefectureFeaturesCache: Feature[] | null = null;

function normalizePrefCode(value: unknown): number | null {
  const code = String(value ?? '').match(/\d{2}/)?.[0];
  return code ? Number(code) : null;
}

function readPrefectureFeatures(): Feature[] {
  if (prefectureFeaturesCache) return prefectureFeaturesCache;

  // Cloudflare Workers を含む全ランタイムで同じ地図を使うため、GIS SSOTを
  // ビルド時に静的モジュールとして同梱する。実行時の node:fs には依存しない。
  const topology = prefectureTopology as unknown as Topology;
  const objectName = Object.keys(topology.objects)[0];
  const geojson = feature(
    topology,
    topology.objects[objectName] as GeometryCollection
  ) as FeatureCollection;
  prefectureFeaturesCache = geojson.features;
  return prefectureFeaturesCache;
}

function keepMainlandPolygons(featureItem: Feature): Feature | null {
  if (
    featureItem.geometry.type !== 'Polygon' &&
    featureItem.geometry.type !== 'MultiPolygon'
  ) {
    return null;
  }

  const polygons =
    featureItem.geometry.type === 'Polygon'
      ? [featureItem.geometry.coordinates]
      : featureItem.geometry.coordinates;
  const mainlandPolygons = polygons.filter((coordinates) => {
    const [lon, lat] = geoCentroid({ type: 'Polygon', coordinates });
    return lon >= 128 && lon <= 146 && lat >= 30 && lat <= 46;
  });
  if (mainlandPolygons.length === 0) return null;

  return {
    ...featureItem,
    geometry:
      mainlandPolygons.length === 1
        ? ({
            type: 'Polygon',
            coordinates: mainlandPolygons[0],
          } satisfies Polygon)
        : ({
            type: 'MultiPolygon',
            coordinates: mainlandPolygons,
          } satisfies MultiPolygon),
  };
}

function overviewRegionIndex(prefCode: number): number {
  if (prefCode === 1) return 0;
  if (prefCode <= 7) return 1;
  if (prefCode <= 14) return 2;
  if (prefCode <= 23) return 3;
  if (prefCode <= 30) return 4;
  if (prefCode <= 35) return 5;
  if (prefCode <= 39) return 6;
  if (prefCode <= 46) return 7;
  return 8;
}

function overviewFill(prefCode: number): string {
  const opacity = OVERVIEW_REGION_OPACITY[overviewRegionIndex(prefCode)];
  return `hsl(var(--primary) / ${opacity})`;
}

function squaredSegmentDistance(
  point: ScreenPoint,
  segmentStart: ScreenPoint,
  segmentEnd: ScreenPoint
): number {
  let x = segmentStart[0];
  let y = segmentStart[1];
  let deltaX = segmentEnd[0] - x;
  let deltaY = segmentEnd[1] - y;

  if (deltaX !== 0 || deltaY !== 0) {
    const position =
      ((point[0] - x) * deltaX + (point[1] - y) * deltaY) /
      (deltaX * deltaX + deltaY * deltaY);
    if (position > 1) {
      x = segmentEnd[0];
      y = segmentEnd[1];
    } else if (position > 0) {
      x += deltaX * position;
      y += deltaY * position;
    }
  }

  deltaX = point[0] - x;
  deltaY = point[1] - y;
  return deltaX * deltaX + deltaY * deltaY;
}

/**
 * TopoJSONの高精細な輪郭を、320×190pxで見分けられる精度まで簡略化する。
 * 投影後の座標で処理するため、表示サイズに対して一貫した許容誤差になる。
 */
function simplifyProjectedPoints(
  points: ScreenPoint[],
  tolerance: number
): ScreenPoint[] {
  if (points.length <= 3) return points;

  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const pendingSegments: Array<readonly [number, number]> = [
    [0, points.length - 1],
  ];
  const squaredTolerance = tolerance * tolerance;

  while (pendingSegments.length > 0) {
    const [startIndex, endIndex] = pendingSegments.pop()!;
    let furthestIndex = -1;
    let furthestDistance = squaredTolerance;

    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const distance = squaredSegmentDistance(
        points[index],
        points[startIndex],
        points[endIndex]
      );
      if (distance > furthestDistance) {
        furthestIndex = index;
        furthestDistance = distance;
      }
    }

    if (furthestIndex !== -1) {
      keep[furthestIndex] = 1;
      pendingSegments.push(
        [startIndex, furthestIndex],
        [furthestIndex, endIndex]
      );
    }
  }

  return points.filter((_, index) => keep[index] === 1);
}

function formatPathCoordinate(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

function compactProjectedPath(
  featureItem: Feature,
  projection: GeoProjection
): string {
  if (
    featureItem.geometry.type !== 'Polygon' &&
    featureItem.geometry.type !== 'MultiPolygon'
  ) {
    return '';
  }

  const polygons =
    featureItem.geometry.type === 'Polygon'
      ? [featureItem.geometry.coordinates]
      : featureItem.geometry.coordinates;

  return polygons
    .flatMap((polygon) =>
      polygon.map((ring) => {
        const projectedPoints = ring
          .slice(0, -1)
          .map((coordinate) => projection([coordinate[0], coordinate[1]]))
          .filter((point): point is [number, number] => point !== null);
        const simplifiedPoints = simplifyProjectedPoints(
          projectedPoints,
          PROJECTED_PATH_TOLERANCE
        );
        if (simplifiedPoints.length < 3) return '';

        const coordinates = simplifiedPoints
          .map(
            ([x, y]) => `${formatPathCoordinate(x)},${formatPathCoordinate(y)}`
          )
          .join(' ');
        return `M${coordinates}Z`;
      })
    )
    .join('');
}

interface MiniMainlandShape {
  /** 順位配色の解決キー。properties から取れない場合だけ null。 */
  readonly prefCode: number | null;
  /** 投影・簡略化済みの path。順位や配色に依存しない。 */
  readonly path: string;
}

let miniMainlandGeometryCache: MiniMainlandShape[] | null = null;

/**
 * mini thumbnail の本土形状を1回だけ投影・簡略化して保持する。
 *
 * projection と地理形状は引数 (順位・配色) に依存しないため、カードごとに
 * 再投影・再文字列化する必要がない。順位由来の fill と1位リングは呼び出しごとに
 * 計算するので、色を含む完成SVGはここで cache しない。
 */
function readMiniMainlandGeometry(): MiniMainlandShape[] {
  if (miniMainlandGeometryCache) return miniMainlandGeometryCache;

  const mainlandFeatures = readPrefectureFeatures()
    .filter(
      (prefecture) => normalizePrefCode(prefecture.properties?.N03_007) !== 47
    )
    .map(keepMainlandPolygons)
    .filter((prefecture): prefecture is Feature => prefecture !== null);
  const mainlandCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: mainlandFeatures,
  };
  const mainlandProjection = geoMercator()
    // d3 projection.angle は画面上の時計回りと符号が逆なので負値を渡す。
    .angle(-MINI_PREFECTURE_THUMBNAIL_LAYOUT.mainlandClockwiseRotationDegrees)
    .fitExtent(
      [
        [MAP_PADDING, MAP_PADDING],
        [WIDTH - MAP_PADDING, HEIGHT - MAP_PADDING],
      ],
      mainlandCollection
    );

  miniMainlandGeometryCache = mainlandFeatures.map((prefecture) => {
    const properties = prefecture.properties ?? {};
    return {
      prefCode: normalizePrefCode(
        properties.N03_007 ?? properties.prefCode ?? properties.code
      ),
      path: compactProjectedPath(prefecture, mainlandProjection),
    };
  });
  return miniMainlandGeometryCache;
}

let prefectureOverviewSvgCache: string | null = null;

/**
 * home の都道府県入口用に、TopoJSON SSOTから全国概観SVGを生成する。
 *
 * ランキングサムネイルとは責務を分け、地理の把握を優先して本土を回転させない。
 * 沖縄は省略せず左下インセットへ収め、凡例や順位表現は持ち込まない。
 */
export function generatePrefectureOverviewSvg(): string {
  // 引数を持たず TopoJSON と CSS token 文字列だけから決定的に生成されるため、
  // 完成文字列をそのまま再利用してよい。
  if (prefectureOverviewSvgCache) return prefectureOverviewSvgCache;

  const prefectureFeatures = readPrefectureFeatures();
  const mainlandFeatures = prefectureFeatures
    .filter(
      (prefecture) => normalizePrefCode(prefecture.properties?.N03_007) !== 47
    )
    .map(keepMainlandPolygons)
    .filter((prefecture): prefecture is Feature => prefecture !== null);
  const okinawa = prefectureFeatures.find(
    (prefecture) => normalizePrefCode(prefecture.properties?.N03_007) === 47
  );
  const mainlandCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: mainlandFeatures,
  };
  const mainlandProjection = geoMercator().fitExtent(
    [
      [OVERVIEW_MAINLAND_LEFT, MAP_PADDING],
      [WIDTH - MAP_PADDING, HEIGHT - MAP_PADDING],
    ],
    mainlandCollection
  );
  const okinawaProjection = okinawa
    ? geoMercator().fitExtent(
        [
          [
            OVERVIEW_OKINAWA_INSET.x + MAP_PADDING,
            OVERVIEW_OKINAWA_INSET.y + MAP_PADDING,
          ],
          [
            OVERVIEW_OKINAWA_INSET.x +
              OVERVIEW_OKINAWA_INSET.width -
              MAP_PADDING,
            OVERVIEW_OKINAWA_INSET.y +
              OVERVIEW_OKINAWA_INSET.height -
              MAP_PADDING,
          ],
        ],
        okinawa
      )
    : null;

  const renderShape = (prefecture: Feature, pathValue: string) => {
    const prefCode = normalizePrefCode(prefecture.properties?.N03_007);
    if (prefCode === null) return '';
    return `<path data-pref-code="${String(prefCode).padStart(2, '0')}" d="${pathValue}" fill="${overviewFill(prefCode)}" fill-rule="evenodd" stroke="hsl(var(--background))" stroke-width="0.85" stroke-linejoin="round"/>`;
  };
  const mainlandShapes = mainlandFeatures.map((prefecture) =>
    renderShape(
      prefecture,
      compactProjectedPath(prefecture, mainlandProjection)
    )
  );
  const okinawaShape =
    okinawa && okinawaProjection
      ? renderShape(okinawa, compactProjectedPath(okinawa, okinawaProjection))
      : '';

  prefectureOverviewSvgCache = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet" data-map-layout="prefecture-overview" data-map-rotation="none" data-okinawa="inset">`,
    `<rect x="${OVERVIEW_OKINAWA_INSET.x}" y="${OVERVIEW_OKINAWA_INSET.y}" width="${OVERVIEW_OKINAWA_INSET.width}" height="${OVERVIEW_OKINAWA_INSET.height}" fill="none" stroke="hsl(var(--border))" stroke-width="0.8"/>`,
    mainlandShapes.join(''),
    okinawaShape,
    '</svg>',
  ].join('');
  return prefectureOverviewSvgCache;
}

/**
 * buzz-map と同じ都道府県 TopoJSON から、portal card 用の地理形状SVGを生成する。
 * SNS creative の文字やCTAは持ち込まず、順位配色・1位強調だけを共有する。
 * 横長カードで本土を大きく見せるため時計回りに回転し、沖縄インセットは省略する。
 * 元データと通常の地図表示は変更せず、このサムネイル描画だけに適用する。
 */
export function generateMiniPrefectureSvg(
  data: Array<{ areaCode: string; value: number; rank?: number }>,
  colorScheme?: string,
  isReversed?: boolean,
  gradientIdSuffix?: string
): string {
  const interpolator = resolveInterpolator(colorScheme);
  const sorted = [...data].sort((a, b) =>
    isReversed ? a.value - b.value : b.value - a.value
  );
  const derivedRank = new Map(
    sorted.map((row, index) => [row.areaCode.slice(0, 2), index + 1])
  );
  const rankByCode = new Map<number, number>();

  for (const row of data) {
    const prefCode = normalizePrefCode(row.areaCode);
    if (prefCode === null) continue;
    rankByCode.set(
      prefCode,
      row.rank ?? derivedRank.get(row.areaCode.slice(0, 2)) ?? data.length
    );
  }

  const geometry = readMiniMainlandGeometry();
  const count = Math.max(rankByCode.size, 1);

  const shapes = geometry.map(({ prefCode, path }) => {
    const rank = prefCode === null ? undefined : rankByCode.get(prefCode);
    const rankT =
      rank === undefined || count === 1 ? 0 : (count - rank) / (count - 1);
    const fill =
      rank === undefined
        ? NO_DATA_COLOR
        : interpolator(T_MIN + rankT * (T_MAX - T_MIN));
    const isTop = rank === 1;
    return `<path d="${path}" fill="${fill}" stroke="${isTop ? TOP_RING_COLOR : '#fff'}" stroke-width="${isTop ? 2.2 : 0.75}" stroke-linejoin="round"/>`;
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet" data-map-rotation="clockwise-${MINI_PREFECTURE_THUMBNAIL_LAYOUT.mainlandClockwiseRotationDegrees}" data-okinawa="${MINI_PREFECTURE_THUMBNAIL_LAYOUT.okinawa}" data-map-format="${MINI_PREFECTURE_MAP_FORMAT}">`,
    shapes.join(''),
    '</svg>',
  ].join('');
}

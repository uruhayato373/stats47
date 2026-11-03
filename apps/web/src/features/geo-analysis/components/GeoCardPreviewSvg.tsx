import { MapPin } from 'lucide-react';

import { GEO_MAP_COLORS } from '../lib/geo-map.palette';

import type { buildGeoCardPreview } from '../lib/geo-card-preview';

type GeoCardPreview = NonNullable<ReturnType<typeof buildGeoCardPreview>>;

/** 地図の枠の縦横比 (幅 / 高さ)。記事カード (ArticleTeaserCard) のサムネイルと同じ 40:21 */
const PREVIEW_FRAME_ASPECT = 40 / 21;
/** 県の外形の外に取る余白 (viewBox 単位)。上下は駅名の文字、左右は文字の幅の半分ほど。 */
const PREVIEW_MARGIN = { x: 40, y: 28 } as const;
/**
 * 駅名の文字の大きさ (viewBox 単位)。横長の枠では viewBox の高さがおよそ 300 になり、
 * 3 列のカード (幅 350px 前後) で 10px ほどに描かれる。位置の目印なので地図より目立たせない。
 */
const LANDMARK_FONT_SIZE = 14;
/** 駅の点の半径 (viewBox 単位)。文字に合わせて小さくする */
const LANDMARK_RADIUS = 3.5;
/** 駅名の文字が重なるときに残す順。後ろの名前ほど先に省く (点は残す)。 */
const LANDMARK_LABEL_PRIORITY = ['神戸駅', '豊岡駅', '姫路駅'];

/**
 * buildGeoCardPreview と同じ投影 (640×360・中心 320,180・外形を 568×240 に収める) で県の外形の箱を求め、
 * 余白を足して枠の縦横比に合わせた viewBox を返す。枠に対して地図が小さく描かれる (letterbox) のを防ぐ。
 */
function previewViewBox(bounds: readonly [number, number, number, number]): string {
  const [west, south, east, north] = bounds;
  const longitudeScale = Math.cos((((south + north) / 2) * Math.PI) / 180);
  const scale = Math.min(568 / ((east - west) * longitudeScale), 240 / (north - south));
  let width = (east - west) * longitudeScale * scale + PREVIEW_MARGIN.x * 2;
  let height = (north - south) * scale + PREVIEW_MARGIN.y * 2;
  if (width / height < PREVIEW_FRAME_ASPECT) width = height * PREVIEW_FRAME_ASPECT;
  else height = width / PREVIEW_FRAME_ASPECT;
  return [320 - width / 2, 180 - height / 2, width, height]
    .map((value) => value.toFixed(1))
    .join(' ');
}

function labelOffset(below?: boolean): number {
  return below ? LANDMARK_FONT_SIZE + 4 : -7;
}

function visibleLandmarkLabels(
  landmarks: readonly { name: string; x: number; y: number; below?: boolean }[]
): Set<string> {
  const rank = (name: string) => {
    const index = LANDMARK_LABEL_PRIORITY.indexOf(name);
    return index === -1 ? LANDMARK_LABEL_PRIORITY.length : index;
  };
  const placed: { left: number; right: number; top: number; bottom: number }[] = [];
  const visible = new Set<string>();
  for (const place of [...landmarks].sort((a, b) => rank(a.name) - rank(b.name))) {
    const halfWidth = (place.name.length * LANDMARK_FONT_SIZE) / 2;
    const baseline = place.y + labelOffset(place.below);
    const box = {
      left: place.x - halfWidth,
      right: place.x + halfWidth,
      top: baseline - LANDMARK_FONT_SIZE,
      bottom: baseline + 4,
    };
    const overlaps = placed.some(
      (other) =>
        box.left < other.right &&
        other.left < box.right &&
        box.top < other.bottom &&
        other.top < box.bottom
    );
    if (overlaps) continue;
    placed.push(box);
    visible.add(place.name);
  }
  return visible;
}

/**
 * Geo の一覧のカードの見本の地図 (静的な SVG)。記事カードの media に渡す。県の外形・メッシュの塗り・点・駅の目印を描く。
 * 分析の一覧 (GeoAnalysisCards) と層の一覧 (GeoLayerCards) で共用する (2026-11-03)。
 */
export function GeoCardPreviewSvg({
  preview,
  bounds,
  ariaLabel,
}: {
  preview: GeoCardPreview;
  /** 県の外形の経緯度の範囲 (getPrefectureCardGeography の bounds) */
  bounds: readonly [number, number, number, number];
  ariaLabel: string;
}) {
  const labelled = visibleLandmarkLabels(preview.landmarks);
  return (
    <svg
      viewBox={previewViewBox(bounds)}
      role="img"
      aria-label={ariaLabel}
      className="absolute inset-0 block h-full w-full overflow-hidden bg-muted"
    >
      <path d={preview.boundary} fill={GEO_MAP_COLORS.cardPreview.prefectureFill} fillRule="evenodd" />
      {preview.paths.map((path) => (
        <path
          key={path.color}
          d={path.d}
          fill={path.color}
          stroke={GEO_MAP_COLORS.cardPreview.halo}
          strokeWidth="0.7"
        />
      ))}
      {preview.points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="3"
          fill={point.color}
          stroke={GEO_MAP_COLORS.cardPreview.halo}
          strokeWidth="0.8"
        />
      ))}
      <path
        d={preview.boundary}
        fill="none"
        stroke={GEO_MAP_COLORS.cardPreview.prefectureStroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {preview.landmarks.map((place) => (
        <g key={place.name}>
          <circle
            cx={place.x}
            cy={place.y}
            r={LANDMARK_RADIUS}
            fill={GEO_MAP_COLORS.cardPreview.landmark}
            stroke={GEO_MAP_COLORS.cardPreview.halo}
            strokeWidth="1.5"
          />
          {labelled.has(place.name) && (
            <text
              x={place.x}
              y={place.y + labelOffset(place.below)}
              textAnchor="middle"
              fontSize={LANDMARK_FONT_SIZE}
              fontWeight="600"
              fill={GEO_MAP_COLORS.cardPreview.landmark}
              stroke={GEO_MAP_COLORS.cardPreview.halo}
              strokeWidth="3"
              paintOrder="stroke"
              strokeLinejoin="round"
            >
              {place.name}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/** 見本の地図を取得できなかったときに枠の中へ出す代わりの表示 */
export function GeoCardPreviewFallback() {
  return (
    <div className="flex h-full items-center justify-center gap-2 px-4 text-sm text-muted-foreground">
      <MapPin className="h-5 w-5" aria-hidden="true" />
      地図プレビューを取得できませんでした
    </div>
  );
}

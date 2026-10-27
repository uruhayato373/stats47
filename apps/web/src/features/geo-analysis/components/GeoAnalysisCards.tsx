import type { ReactNode } from 'react';

import { GEO_ANALYSES } from '@stats47/data-configs/business-plan';
import { hrefFor } from '@stats47/data-configs/content/href';
import { ArrowRight, MapPin } from 'lucide-react';

import { SectionHeader } from '@/components/section';
import { SurfaceLinkCard } from '@/components/surface';

import {
  getPrefectureCardGeography,
  geoCardLandmarks,
} from '../lib/geo-card-geography';
import { buildGeoCardPreview } from '../lib/geo-card-preview';
import { GEO_CROSS_ANALYSIS_CONFIGS } from '../lib/geo-cross-analysis';
import {
  GEO_DEFAULT_PREF_CODE,
  GEO_DEFAULT_PREF_LABEL,
} from '../lib/geo-default-prefecture';
import { GEO_HOME_ANALYSIS_LABELS } from '../lib/geo-home-copy';
import { GEO_MAP_COLORS } from '../lib/geo-map.palette';
import { loadGeoAnalysisPrefBundle } from '../lib/load-geo-analysis-evidence';


const cardCopy = {
  'population-land-price': {
    question: '地価が上がる場所、将来の人口は？',
    description:
      '住宅地の地点と将来人口を重ね、同じ県内でも異なる組み合わせを探します。',
    legend:
      '赤い点：地価上昇×人口減少。灰の点：その他・比較対象外。背景：人口メッシュ。',
  },
  'population-flood-risk': {
    question: '人口が残る場所と、洪水の想定は？',
    description:
      '浸水想定区域に中心点が入るメッシュを確認し、将来の人口分布と照らし合わせます。',
    legend: '赤：中心点が浸水想定区域内。灰：今回の判定では区域外。',
  },
  'population-station-access': {
    question: '将来の人口は、駅の近くに残る？',
    description:
      '駅から直線800m以内のメッシュと圏外を比べ、人口の変化を調べます。',
    legend: '緑：中心点が駅800m圏内。灰：圏外。白い点：駅代表点。',
  },
} as const;

/**
 * 地図の枠の縦横比 (幅 / 高さ)。縦長の県 (既定の兵庫県) が枠の幅いっぱいに近づくよう 4:3 にする。
 * 16:7 の横長の枠では、縦に収めた県の左右が大きく空いていた。
 */
const PREVIEW_FRAME_ASPECT = 4 / 3;
/** 県の外形の外に取る余白 (viewBox 単位)。上下は駅名の文字、左右は文字の幅の半分ほど。 */
const PREVIEW_MARGIN = { x: 56, y: 44 } as const;
/** 駅名の文字の大きさ (viewBox 単位)。 */
const LANDMARK_FONT_SIZE = 20;

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
  return below ? LANDMARK_FONT_SIZE + 6 : -10;
}

/** 駅名の文字が重なるときに残す順。後ろの名前ほど先に省く (点は残す)。 */
const LANDMARK_LABEL_PRIORITY = ['神戸駅', '豊岡駅', '姫路駅'];

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

const PREVIEW_SLUGS = [
  'population-land-price',
  'population-flood-risk',
  'population-station-access',
] as const;

interface GeoAnalysisCardsProps {
  /** 地図付きカードの直下に置く注記 (表示例の県・出典)。地図の無い分析の節より前に出す */
  previewFootnote?: ReactNode;
}

export async function GeoAnalysisCards({ previewFootnote }: GeoAnalysisCardsProps = {}) {
  const cards = await Promise.all(
    PREVIEW_SLUGS.map(async (slug) => ({
      slug,
      bundle: await loadGeoAnalysisPrefBundle(slug, GEO_DEFAULT_PREF_CODE),
    }))
  );
  const geography = getPrefectureCardGeography(GEO_DEFAULT_PREF_CODE);
  const stationDetail = cards.find(
    (card) => card.slug === 'population-station-access'
  )?.bundle?.detail;
  const landmarks =
    stationDetail?.slug === 'population-station-access'
      ? geoCardLandmarks(stationDetail)
      : [];
  const viewBox = previewViewBox(geography.bounds);
  const otherAnalyses = GEO_ANALYSES.filter(
    (analysis) => !PREVIEW_SLUGS.some((slug) => slug === analysis.slug)
  );
  return (
    <div className="@container" data-testid="geo-analysis-cards">
      {/* 地図付きの 3 枚は、並べるときは 3 列にして空きマスを作らない (2 列だと 3 枚目の横が空く)。
          境界は本文の実寸 (40rem) で決める。@md (768px) ではサイドバーのある 1024px 幅で効かなかった */}
      <div className="grid gap-4 @min-[40rem]:grid-cols-3">
        {cards.map(({ slug, bundle }) => {
          const config = GEO_CROSS_ANALYSIS_CONFIGS[slug];
          const copy = cardCopy[slug];
          const preview = bundle
            ? buildGeoCardPreview(bundle.detail, geography, landmarks)
            : null;
          const labelled = preview
            ? visibleLandmarkLabels(preview.landmarks)
            : new Set<string>();
          return (
            <SurfaceLinkCard
              key={slug}
              href={hrefFor('geo', { analysisSlug: slug })}
              aria-label={`${copy.question} ${config.eyebrow}の地図を見る`}
              className="group flex min-w-0 flex-col overflow-hidden p-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {/* 地図はどの幅でもカード上部の全幅に置く (狭い幅で左の細い列に押し込まない)。
                  viewBox を県の外形と枠の縦横比から決め、地図を枠いっぱいに描く */}
              <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden border-b bg-muted">
                {preview ? (
                  <svg
                    viewBox={viewBox}
                    role="img"
                    aria-label={`${GEO_DEFAULT_PREF_LABEL}の行政界と${config.overlapLabel}`}
                    className="absolute inset-0 block h-full w-full overflow-hidden bg-muted"
                  >
                    <path
                      d={preview.boundary}
                      fill={GEO_MAP_COLORS.cardPreview.prefectureFill}
                      fillRule="evenodd"
                    />
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
                        r={slug === 'population-land-price' ? 3 : 2.6}
                        fill={point.color}
                        stroke={
                          slug === 'population-land-price'
                            ? GEO_MAP_COLORS.cardPreview.halo
                            : GEO_MAP_COLORS.cardPreview.landmark
                        }
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
                          r="5"
                          fill={GEO_MAP_COLORS.cardPreview.landmark}
                          stroke={GEO_MAP_COLORS.cardPreview.halo}
                          strokeWidth="2"
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
                            strokeWidth="4"
                            paintOrder="stroke"
                            strokeLinejoin="round"
                          >
                            {place.name}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>
                ) : (
                  <div className="flex h-full items-center justify-center gap-2 px-4 text-sm text-muted-foreground">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                    地図プレビューを取得できませんでした
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-4">
                {/* 表示している県は地図に重ねず、地図の下に書く */}
                {preview && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    {GEO_DEFAULT_PREF_LABEL}
                  </p>
                )}
                <p className="text-xs font-semibold text-primary">
                  {config.eyebrow}
                </p>
                <h3 className="mt-1 text-base font-bold leading-relaxed group-hover:text-primary">
                  {copy.question}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {copy.description}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {copy.legend}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <span className="hidden text-xs text-muted-foreground @sm:inline">
                    47都道府県対応
                  </span>
                  <span className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-primary">
                    地図を見る
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </SurfaceLinkCard>
          );
        })}
      </div>
      {previewFootnote}
      {/* 地図の無い分析は、地図付きのカードと同じ節に混ぜず小見出しを分ける */}
      {otherAnalyses.length > 0 && (
        <section aria-labelledby="geo-other-analyses-heading" className="mt-8">
          <SectionHeader
            as="h3"
            title={<span id="geo-other-analyses-heading">ほかの分析</span>}
          />
          <div className="grid gap-4 @min-[40rem]:grid-cols-2">
            {otherAnalyses.map((analysis) => (
              <SurfaceLinkCard
                key={analysis.slug}
                href={hrefFor('geo', { analysisSlug: analysis.slug })}
                className="group flex min-w-0 items-center gap-3 p-4"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold group-hover:text-primary">
                    {GEO_HOME_ANALYSIS_LABELS[analysis.slug]}
                  </h4>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {analysis.question}
                  </p>
                </div>
                <span className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-primary">
                  詳しく見る
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </SurfaceLinkCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

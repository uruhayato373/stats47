import { GEO_ANALYSES } from '@stats47/data-configs/business-plan';
import { MapPin, ArrowUpRight } from 'lucide-react';

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

const PREVIEW_SLUGS = [
  'population-land-price',
  'population-flood-risk',
  'population-station-access',
] as const;

export async function GeoAnalysisCards() {
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
  return (
    <div className="@container" data-testid="geo-analysis-cards">
      <div className="grid gap-4 @md:grid-cols-2">
        {cards.map(({ slug, bundle }) => {
          const config = GEO_CROSS_ANALYSIS_CONFIGS[slug];
          const copy = cardCopy[slug];
          const preview = bundle
            ? buildGeoCardPreview(bundle.detail, geography, landmarks)
            : null;
          return (
            <SurfaceLinkCard
              key={slug}
              href={`/geo/${slug}`}
              aria-label={`${copy.question} ${config.eyebrow}の地図を見る`}
              className="group grid min-w-0 grid-cols-[112px_minmax(0,1fr)] overflow-hidden p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 @sm:grid-cols-[148px_minmax(0,1fr)] @md:flex @md:flex-col"
            >
              <div className="relative min-h-36 overflow-hidden border-r bg-muted @md:aspect-[16/7] @md:min-h-0 @md:w-full @md:shrink-0 @md:border-b @md:border-r-0">
                {preview ? (
                  <svg
                    viewBox="0 0 640 360"
                    role="img"
                    aria-label={`${GEO_DEFAULT_PREF_LABEL}の行政界と${config.overlapLabel}`}
                    className="absolute inset-0 block h-full w-full overflow-hidden bg-slate-50"
                  >
                    <path
                      d={preview.boundary}
                      fill="#f1f5f9"
                      fillRule="evenodd"
                    />
                    {preview.paths.map((path) => (
                      <path
                        key={path.color}
                        d={path.d}
                        fill={path.color}
                        stroke="#ffffff"
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
                            ? '#ffffff'
                            : '#0f172a'
                        }
                        strokeWidth="0.8"
                      />
                    ))}
                    <path
                      d={preview.boundary}
                      fill="none"
                      stroke="#475569"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    {preview.landmarks.map((place) => (
                      <g key={place.name}>
                        <circle
                          cx={place.x}
                          cy={place.y}
                          r="5"
                          fill="#0f172a"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <text
                          x={place.x}
                          y={place.y + (place.below ? 34 : -15)}
                          textAnchor="middle"
                          fontSize="28"
                          fontWeight="600"
                          fill="#0f172a"
                          stroke="#ffffff"
                          strokeWidth="5"
                          paintOrder="stroke"
                          strokeLinejoin="round"
                        >
                          {place.name}
                        </text>
                      </g>
                    ))}
                  </svg>
                ) : (
                  <div className="flex h-full items-center justify-center gap-2 px-4 text-sm text-muted-foreground">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                    地図プレビューを取得できませんでした
                  </div>
                )}
                {preview && (
                  <span className="absolute bottom-2 left-2 border bg-background/95 px-2 py-1 text-xs">
                    {GEO_DEFAULT_PREF_LABEL}
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-3 @sm:p-4">
                <p className="text-xs font-semibold text-primary">
                  {config.eyebrow}
                </p>
                <h3 className="mt-1 text-base font-bold leading-relaxed group-hover:text-primary @md:text-lg">
                  {copy.question}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground @md:line-clamp-none">
                  {copy.description}
                </p>
                <p className="mt-2 hidden text-xs leading-relaxed text-muted-foreground @md:block">
                  {copy.legend}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <span className="hidden text-xs text-muted-foreground @sm:inline">
                    47都道府県対応
                  </span>
                  <span className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-primary">
                    地図を見る
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </SurfaceLinkCard>
          );
        })}
      </div>
      <div className="mt-4 grid gap-3 @md:grid-cols-2">
        {GEO_ANALYSES.filter(
          (analysis) => !PREVIEW_SLUGS.some((slug) => slug === analysis.slug)
        ).map((analysis) => (
          <SurfaceLinkCard
            key={analysis.slug}
            href={`/geo/${analysis.slug}`}
            className="group flex min-w-0 items-center gap-3 p-4"
          >
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold group-hover:text-primary">
                {GEO_HOME_ANALYSIS_LABELS[analysis.slug]}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {analysis.question}
              </p>
            </div>
            <span className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-primary">
              詳しく見る
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </SurfaceLinkCard>
        ))}
      </div>
    </div>
  );
}

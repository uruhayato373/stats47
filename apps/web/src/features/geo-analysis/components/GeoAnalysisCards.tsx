import { MapPin, ArrowUpRight } from 'lucide-react';

import { SurfaceLinkCard } from '@/components/surface';

import {
  getTokyoMainlandGeography,
  geoCardLandmarks,
} from '../lib/geo-card-geography';
import { buildGeoCardPreview } from '../lib/geo-card-preview';
import {
  GEO_CROSS_ANALYSIS_CONFIGS,
  GEO_CROSS_ANALYSIS_SLUGS,
} from '../lib/geo-cross-analysis';
import { loadGeoAnalysisPrefBundle } from '../lib/load-geo-analysis-evidence';

const cardCopy = {
  'population-land-price': {
    question: '地価が上がる場所、将来の人口は？',
    description:
      '住宅地の地点と将来人口を重ね、同じ県内でも異なる組み合わせを探します。',
    legend:
      '赤い点：地価上昇×人口減少。灰の点：その他・比較対象外。背景：人口メッシュ。',
    note: '地価2025→2026年 × 人口2020→2050年。将来地価の予測ではありません。',
  },
  'population-flood-risk': {
    question: '人口が残る場所と、洪水の想定は？',
    description:
      '浸水想定区域に中心点が入るメッシュを確認し、将来の人口分布と照らし合わせます。',
    legend: '赤：中心点が浸水想定区域内。灰：今回の判定では区域外。',
    note: '原典の浸水範囲ではなく、1kmメッシュの判定結果です。灰色も安全を意味しません。',
  },
  'population-station-access': {
    question: '将来の人口は、駅の近くに残る？',
    description:
      '駅から直線800m以内のメッシュと圏外を比べ、人口の変化を調べます。',
    legend: '緑：中心点が駅800m圏内。灰：圏外。白い点：駅代表点。',
    note: '人口2020→2050年。直線距離による判定で、実際の徒歩経路とは異なります。',
  },
} as const;

export async function GeoAnalysisCards() {
  const cards = await Promise.all(
    GEO_CROSS_ANALYSIS_SLUGS.map(async (slug) => ({
      slug,
      bundle: await loadGeoAnalysisPrefBundle(slug, '13'),
    }))
  );
  const geography = getTokyoMainlandGeography();
  const stationDetail = cards.find(
    (card) => card.slug === 'population-station-access'
  )?.bundle?.detail;
  const landmarks =
    stationDetail?.slug === 'population-station-access'
      ? geoCardLandmarks(stationDetail)
      : [];
  return (
    <div className="grid gap-5 sm:grid-cols-2" data-testid="geo-analysis-cards">
      {cards.map(({ slug, bundle }) => {
        const config = GEO_CROSS_ANALYSIS_CONFIGS[slug];
        const copy = cardCopy[slug];
        const preview = bundle
          ? buildGeoCardPreview(bundle.detail, geography, landmarks)
          : null;
        return (
          <SurfaceLinkCard
            key={slug}
            href={`/geo/${slug}?pref=13&stage=overlap`}
            aria-label={`${copy.question} ${config.eyebrow}の地図を見る`}
            className="group flex min-w-0 flex-col overflow-hidden p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="relative aspect-video w-full shrink-0 overflow-hidden border-b bg-muted">
              {preview ? (
                <svg
                  viewBox="0 0 640 360"
                  role="img"
                  aria-label={`${bundle?.detail.areaName}本土の行政界と${config.overlapLabel}`}
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
                        slug === 'population-land-price' ? '#ffffff' : '#0f172a'
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
                  東京都本土（島しょを除く）
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <p className="text-xs font-semibold text-primary">
                {config.eyebrow}
              </p>
              <h3 className="mt-2 text-lg font-bold leading-relaxed group-hover:text-primary">
                {copy.question}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {copy.description}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {copy.legend}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {copy.note}
              </p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                <span className="text-xs text-muted-foreground">
                  47都道府県に切り替え可能
                </span>
                <span className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-primary">
                  地図を見る
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </div>
          </SurfaceLinkCard>
        );
      })}
    </div>
  );
}

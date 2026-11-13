import type { ReactNode } from 'react';

import { GEO_ANALYSES } from '@stats47/data-configs/business-plan';
import { hrefFor } from '@stats47/data-configs/content/href';
import { ArrowRight } from 'lucide-react';

import { SectionHeader } from '@/components/section';
import { ArticleTeaserCard, CardGrid, SurfaceLinkCard } from '@/components/surface';

import { navSurfaceProps } from '@/lib/analytics/events';

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

import { GeoCardPreviewFallback, GeoCardPreviewSvg } from './GeoCardPreviewSvg';


const cardCopy = {
  'population-land-price': {
    question: '地価が上がる場所、将来の人口は？',
    description:
      '住宅地の地点と将来人口を重ね、同じ県内でも異なる組み合わせを探します。',
  },
  'population-flood-risk': {
    question: '人口が残る場所と、洪水の想定は？',
    description:
      '浸水想定区域に中心点が入るメッシュを確認し、将来の人口分布と照らし合わせます。',
  },
  'population-station-access': {
    question: '将来の人口は、駅の近くに残る？',
    description:
      '駅から直線800m以内のメッシュと圏外を比べ、人口の変化を調べます。',
  },
} as const;

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
  const otherAnalyses = GEO_ANALYSES.filter(
    (analysis) => !PREVIEW_SLUGS.some((slug) => slug === analysis.slug)
  );
  return (
    <>
      {/* 地図付きの 3 枚は、並べるときは 3 列にして空きマスを作らない (2 列だと 3 枚目の横が空く)。
          境界は本文の実寸 (40rem) で決める。@md (768px) ではサイドバーのある 1024px 幅で効かなかった */}
      <CardGrid>
        {cards.map(({ slug, bundle }) => {
          const config = GEO_CROSS_ANALYSIS_CONFIGS[slug];
          const copy = cardCopy[slug];
          const preview = bundle
            ? buildGeoCardPreview(bundle.detail, geography, landmarks)
            : null;
          return (
            <ArticleTeaserCard
              key={slug}
              href={hrefFor('geo', { analysisSlug: slug })}
              navSurface="geo_analysis_list"
              media={
                preview ? (
                  <GeoCardPreviewSvg
                    preview={preview}
                    bounds={geography.bounds}
                    ariaLabel={`${GEO_DEFAULT_PREF_LABEL}の行政界と${config.overlapLabel}`}
                  />
                ) : (
                  <GeoCardPreviewFallback />
                )
              }
              meta={`${preview ? `${GEO_DEFAULT_PREF_LABEL} · ` : ''}${config.eyebrow}`}
              title={copy.question}
              description={copy.description}
            />
          );
        })}
      </CardGrid>
      {previewFootnote && <div>{previewFootnote}</div>}
      {/* 地図の無い分析は、地図付きのカードと同じ節に混ぜず小見出しを分ける */}
      {otherAnalyses.length > 0 && (
        <section aria-labelledby="geo-other-analyses-heading">
          <SectionHeader
            as="h3"
            title={<span id="geo-other-analyses-heading">ほかの分析</span>}
          />
          <div className="grid gap-4 @min-[40rem]:grid-cols-2">
            {otherAnalyses.map((analysis) => (
              <SurfaceLinkCard
                key={analysis.slug}
                href={hrefFor('geo', { analysisSlug: analysis.slug })}
                {...navSurfaceProps('geo_analysis_list')}
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
    </>
  );
}

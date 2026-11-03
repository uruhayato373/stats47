import { GEO_LAYERS } from '@stats47/data-configs/business-plan';

import { ArticleTeaserCard, CardGrid } from '@/components/surface';

import { getPrefectureCardGeography } from '../lib/geo-card-geography';
import { buildGeoCardPreview } from '../lib/geo-card-preview';
import {
  GEO_DEFAULT_PREF_CODE,
  GEO_DEFAULT_PREF_LABEL,
} from '../lib/geo-default-prefecture';
import { loadGeoAnalysisPrefBundle } from '../lib/load-geo-analysis-evidence';

import { GeoCardPreviewFallback, GeoCardPreviewSvg } from './GeoCardPreviewSvg';


export async function GeoLayerCards() {
  const geography = getPrefectureCardGeography(GEO_DEFAULT_PREF_CODE);
  const cards = await Promise.all(
    GEO_LAYERS.map(async (layer) => ({
      layer,
      bundle: await loadGeoAnalysisPrefBundle(
        layer.sourceAnalysis,
        GEO_DEFAULT_PREF_CODE
      ),
    }))
  );
  return (
    <CardGrid>
      {cards.map(({ layer, bundle }) => {
        const preview = bundle
          ? buildGeoCardPreview(bundle.detail, geography, [], layer.kind)
          : null;
        return (
          <ArticleTeaserCard
            key={layer.slug}
            href={`/geo/layers/${layer.slug}`}
            media={
              preview ? (
                <GeoCardPreviewSvg
                  preview={preview}
                  bounds={geography.bounds}
                  ariaLabel={`${layer.name}・${GEO_DEFAULT_PREF_LABEL}の表示例`}
                />
              ) : (
                <GeoCardPreviewFallback />
              )
            }
            meta={`${GEO_DEFAULT_PREF_LABEL} · ${layer.representation}`}
            title={layer.name}
            description={layer.description}
          />
        );
      })}
    </CardGrid>
  );
}

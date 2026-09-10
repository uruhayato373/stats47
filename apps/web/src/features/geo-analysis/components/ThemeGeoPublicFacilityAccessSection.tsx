import Link from 'next/link';

import { GEO_ANALYSES } from '@stats47/data-configs/business-plan';

import { SectionHeader } from '@/components/section';
import { SurfaceSection } from '@/components/surface';

import { loadGeoAnalysisBundle } from '../lib/load-geo-analysis-snapshot';

import { ThemeGeoPublicFacilityAccessClient } from './ThemeGeoPublicFacilityAccessClient';
export async function ThemeGeoPublicFacilityAccessSection() {
  const slug = 'population-public-facility-access';
  const spec = GEO_ANALYSES.find(
    (analysis) => analysis.slug === slug
  );
  const bundle = await loadGeoAnalysisBundle(slug);
  if (!spec || !bundle)
    return (
      <SurfaceSection>
        <SectionHeader title="公共施設への距離帯別人口" hideRule />
        <p className="text-sm text-muted-foreground">
          検証済みの公共施設アクセス分析を取得できません。
        </p>
        <Link
          className="mt-3 inline-block text-sm text-primary underline"
          href={`/geo/${slug}`}
        >
          公共施設アクセスの分析詳細
        </Link>
      </SurfaceSection>
    );
  return (
    <ThemeGeoPublicFacilityAccessClient
      analysisId={spec.id}
      snapshot={bundle.snapshot}
      manifest={bundle.manifest}
    />
  );
}

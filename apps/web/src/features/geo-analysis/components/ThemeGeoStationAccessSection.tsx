import Link from 'next/link';

import { GEO_ANALYSES } from '@stats47/data-configs/business-plan';

import { SectionHeader } from '@/components/section';
import { SurfaceSection } from '@/components/surface';

import { loadGeoAnalysisBundle } from '../lib/load-geo-analysis-snapshot';

import { ThemeGeoStationAccessClient } from './ThemeGeoStationAccessClient';

export async function ThemeGeoStationAccessSection() {
  const slug = 'population-station-access';
  const spec = GEO_ANALYSES.find(
    (analysis) => analysis.slug === slug
  );
  const bundle = await loadGeoAnalysisBundle(slug);
  if (!spec || !bundle) {
    return (
      <SurfaceSection>
        <SectionHeader title="駅800m圏の人口" hideRule />
        <p className="text-sm text-muted-foreground">
          現在、検証済みの駅アクセス分析データを取得できません。
        </p>
        <Link
          className="mt-3 inline-block text-sm text-primary underline"
          href={`/geo/${slug}`}
        >
          駅アクセスの分析詳細を見る
        </Link>
      </SurfaceSection>
    );
  }
  return (
    <ThemeGeoStationAccessClient
      analysisId={spec.id}
      snapshot={bundle.snapshot}
      manifest={bundle.manifest}
    />
  );
}

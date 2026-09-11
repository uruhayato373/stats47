import { GEO_ANALYSES } from '@stats47/data-configs/business-plan';

import { SectionHeader } from '@/components/section';
import { SurfaceSection } from '@/components/surface';

import { loadGeoAnalysisBundle } from '../lib/load-geo-analysis-snapshot';

import { ThemeGeoLandslideExposureClient } from './ThemeGeoLandslideExposureClient';
export async function ThemeGeoLandslideExposureSection() {
  const slug = 'population-landslide-exposure',
    spec = GEO_ANALYSES.find((a) => a.slug === slug),
    bundle = await loadGeoAnalysisBundle(slug);
  if (!spec || !bundle)
    return (
      <SurfaceSection>
        <SectionHeader title="指定区域面と人口・公共施設" hideRule />
        <p className="text-sm text-muted-foreground">
          検証済みの土砂災害曝露分析を取得できません。
        </p>
      </SurfaceSection>
    );
  return (
    <ThemeGeoLandslideExposureClient
      analysisId={spec.id}
      snapshot={bundle.snapshot}
      manifest={bundle.manifest}
    />
  );
}

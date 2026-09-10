import { GEO_ANALYSES } from '@stats47/data-configs/business-plan';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { loadGeoAnalysisBundle } from '../lib/load-geo-analysis-snapshot';

import { ThemeGeoSnowDesignationClient } from './ThemeGeoSnowDesignationClient';
export async function ThemeGeoSnowDesignationSection() {
  const slug = 'population-snow-designation';
  const spec = GEO_ANALYSES.find((s) => s.slug === slug),
    bundle = await loadGeoAnalysisBundle(slug);
  return spec && bundle ? (
    <ThemeGeoSnowDesignationClient
      analysisId={spec.id}
      snapshot={bundle.snapshot}
      manifest={bundle.manifest}
    />
  ) : (
    <ChartPanel title="豪雪指定区域と人口">
      <p role="status" className="text-sm text-muted-foreground">
        現在、検証済みの豪雪指定区域と人口のデータを取得できません。
      </p>
    </ChartPanel>
  );
}

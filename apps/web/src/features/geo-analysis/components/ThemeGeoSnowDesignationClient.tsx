'use client';
import { useThemePrefecture } from '@/features/theme-dashboard';

import { GeoSnowDesignationSummary } from './GeoSnowDesignationSummary';
import { GeoSpatialEvidenceExplorer } from './GeoSpatialEvidenceExplorer';

import type {
  GeoAnalysisSnapshot,
  GeoAnalysisEvidenceManifest,
} from '@stats47/gis';
export function ThemeGeoSnowDesignationClient({
  analysisId,
  snapshot,
  manifest,
}: {
  analysisId: string;
  snapshot: GeoAnalysisSnapshot;
  manifest: GeoAnalysisEvidenceManifest;
}) {
  const { selectedPrefectureCode, setSelected } = useThemePrefecture();
  return (
    <div
      className="space-y-4"
      data-theme-component-key="snow-designation-population"
      data-data-state="ready"
      data-area-code={selectedPrefectureCode ?? '00000'}
    >
      {selectedPrefectureCode ? (
        <GeoSpatialEvidenceExplorer
          slug="population-snow-designation"
          analysisId={analysisId}
          dataVersion={snapshot.dataVersion}
          initialPrefCode={selectedPrefectureCode.slice(0, 2)}
          initialView="overlap"
          manifest={manifest}
          fixedPrefecture
          syncUrl={false}
        />
      ) : null}
      <GeoSnowDesignationSummary
        snapshot={snapshot}
        selectedAreaCode={selectedPrefectureCode}
        onSelectArea={setSelected}
      />
    </div>
  );
}

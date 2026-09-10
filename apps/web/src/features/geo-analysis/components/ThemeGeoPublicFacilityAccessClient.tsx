'use client';
import { useThemePrefecture } from '@/features/theme-dashboard';

import { GeoPublicFacilitySummary } from './GeoPublicFacilitySummary';
import { GeoSpatialEvidenceExplorer } from './GeoSpatialEvidenceExplorer';

import type {
  GeoAnalysisSnapshot,
  GeoAnalysisEvidenceManifest,
} from '@stats47/gis';
export function ThemeGeoPublicFacilityAccessClient({
  analysisId,
  snapshot,
  manifest,
}: {
  analysisId: string;
  snapshot: GeoAnalysisSnapshot;
  manifest: GeoAnalysisEvidenceManifest;
}) {
  const { selectedPrefectureCode, setSelected } = useThemePrefecture();
  const selected = snapshot.rows.find(
    (row) => row.areaCode === selectedPrefectureCode
  );
  return (
    <div className="space-y-4">
      {selected ? (
        <GeoSpatialEvidenceExplorer
          slug="population-public-facility-access"
          analysisId={analysisId}
          dataVersion={snapshot.dataVersion}
          initialPrefCode={selected.areaCode.slice(0, 2)}
          initialView="overlap"
          manifest={manifest}
          fixedPrefecture
          syncUrl={false}
        />
      ) : null}
      <GeoPublicFacilitySummary
        snapshot={snapshot}
        selectedAreaCode={selectedPrefectureCode}
        onSelectArea={setSelected}
      />
    </div>
  );
}

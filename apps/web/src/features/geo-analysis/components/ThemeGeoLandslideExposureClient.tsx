'use client';
import { useThemePrefecture } from '@/features/theme-dashboard';

import { GeoLandslideSummary } from './GeoLandslideSummary';
import { GeoSpatialEvidenceExplorer } from './GeoSpatialEvidenceExplorer';

import type {
  GeoAnalysisSnapshot,
  GeoAnalysisEvidenceManifest,
} from '@stats47/gis';
export function ThemeGeoLandslideExposureClient({
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
    (r) => r.areaCode === selectedPrefectureCode
  );
  return (
    <div className="space-y-4">
      {selected && selected.areaCode !== '26000' ? (
        <GeoSpatialEvidenceExplorer
          slug="population-landslide-exposure"
          analysisId={analysisId}
          dataVersion={snapshot.dataVersion}
          initialPrefCode={selected.areaCode.slice(0, 2)}
          initialView="overlap"
          manifest={manifest}
          fixedPrefecture
          syncUrl={false}
        />
      ) : null}
      <GeoLandslideSummary
        snapshot={snapshot}
        selectedAreaCode={selectedPrefectureCode}
        onSelectArea={setSelected}
      />
    </div>
  );
}

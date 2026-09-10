/**
 * @stats47/gis エントリーポイント (Client)
 *
 * GIS関連のクライアント向け機能を提供します。
 * サーバー専用の機能は`@stats47/gis/server`に分離されました。
 */

export {
  buildGeoshapeExternalUrl,
} from "./geoshape/utils/geoshape-url-builder";

export { extractPrefectureCode } from "@stats47/area";
export { FLOOD_ARCHIVES, assertFloodArchiveKeys } from './geo-analysis/flood-inputs';

export {
  validateTopojson,
} from "./geoshape/utils/topojson-converter";

export type {
  GeoshapeOptions,
  DesignatedCityWardMode,
} from "./geoshape/types";

export type {
  TopoJSONTopology,
  TopoJSONGeometryCollection,
  TopoJSONGeometry,
} from "@stats47/types";

export type {
  GeoAnalysisArtifactEvidence,
  GeoAnalysisEvidenceManifest,
  GeoAnalysisInputEvidence,
  GeoAnalysisLayerRole,
  GeoAnalysisMetricDefinition,
  GeoAnalysisSnapshot,
  GeoAnalysisSnapshotRow,
  GeoAnalysisSource,
  GeoAnalysisStageEvidence,
  GeoAnalysisStageKind,
  GeoAnalysisPrefDetail,
  GeoFloodMeshCell,
  GeoFloodPrefDetail,
  GeoLandPricePoint,
  GeoLandPricePrefDetail,
  GeoPopulationMeshCell,
  GeoStationAccessMeshCell,
  GeoStationAccessPrefDetail,
  GeoStationAccessStation,
  GeoPublicFacilityPoint,
  GeoPublicFacilityMesh,
  GeoPublicFacilityPrefDetail,
  GeoPublicFacilityBandSummary,
  GeoPublicFacilitySourceSnapshot,
  GeoAnalysisValueFormat,
} from "./geo-analysis/snapshot";

export {
  GEO_STATION_ACCESS_MANIFEST_KEY,
  geoAnalysisManifestKey,
  geoAnalysisPrefKey,
  geoStationAccessPrefKey,
} from "./geo-analysis/snapshot";

export {
  assertFloodConservation,
  assertLandPriceConservation,
  buildFloodPrefDetail,
  buildLandPricePrefDetail,
  type LandPriceDetailPointInput,
} from "./geo-analysis/content-details";

export { mesh1000BoundsFromCode } from "./geo-analysis/geo-analysis-core";
export { validatePublicFacilityDetail, validatePublicFacilityPoints, assertPublicFacilityConservation, publicFacilityDistanceBand } from "./geo-analysis/public-facility-access";

export { SNOW_DESIGNATION_DEFINITION, SNOW_DESIGNATION_DEFINITION_SHA256 } from './geo-analysis/snow-designation-definition';
export { LANDSLIDE_EXPOSURE_DEFINITION, LANDSLIDE_EXPOSURE_DEFINITION_SHA256 } from './geo-analysis/landslide-exposure-definition';
export { parseGeoLandslideSnapshot, parseGeoLandslidePrefDetail, parseGeoLandslideManifest, assertGeoLandslideConservation, assertLandslideSourcePublication, landslideMeshBounds, landslideCounts, landslideValues, landslideNationalValues, expectedLandslideInputs, LANDSLIDE_STAGES, type GeoLandslidePrefDetail, type GeoLandslideMesh, type GeoLandslideFacility, type GeoLandslideSummary, type GeoLandslideCounts } from './geo-analysis/landslide-exposure';
export { parseGeoSnowPrefDetail, parseGeoSnowManifest, assertGeoSnowConservation, snowMeshBounds, type GeoSnowPrefDetail, type GeoSnowMesh, type GeoSnowSummary } from './geo-analysis/snow-designation';

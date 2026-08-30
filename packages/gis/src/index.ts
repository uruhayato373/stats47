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
  GeoStationAccessMeshCell,
  GeoStationAccessPrefDetail,
  GeoStationAccessStation,
  GeoAnalysisValueFormat,
} from "./geo-analysis/snapshot";

export {
  GEO_STATION_ACCESS_MANIFEST_KEY,
  geoStationAccessPrefKey,
} from "./geo-analysis/snapshot";

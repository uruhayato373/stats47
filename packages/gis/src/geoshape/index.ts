/**
 * Geoshapeドメイン - エントリーポイント
 *
 * TopoJSONデータ取得機能を提供。
 */

export {
  fetchPrefectureTopology,
  fetchMunicipalityTopology,
  fetchAllCitiesTopology,
  type Logger,
} from "./services";

export {
  fetchFromExternalAPI,
  fetchTopologyFromR2,
  isExternalAPIAvailable,
  isR2GeoshapeAvailable,
} from "./adapters";

export { fetchTopology } from "./repositories/geoshape-repository";

export {
  buildGeoshapeExternalUrl,
} from "./utils/geoshape-url-builder";

export { extractPrefectureCode } from "@stats47/area";

export {
  validateTopojson,
} from "./utils/topojson-converter";

export type {
  GeoshapeOptions,
  DesignatedCityWardMode,
} from "./types";

export type {
  TopoJSONTopology,
  TopoJSONGeometryCollection,
  TopoJSONGeometry,
} from "@stats47/types";

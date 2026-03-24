import "server-only";

export {
    fetchAllCitiesTopology, fetchMunicipalityTopology, fetchPrefectureTopology, type Logger
} from "./geoshape/services";

export {
    fetchFromExternalAPI,
    isExternalAPIAvailable
} from "./geoshape/adapters";

export { fetchTopology } from "./geoshape/repositories/geoshape-repository";

export {
    findGeoshapeDataDir, getPrefectureSvgDir, getPrefectureTopojsonPath
} from "./geoshape/utils/geoshape-data-dir";

// export 関連は canvas/tokml に依存するため、webpack バンドル対象の server.ts からは除外。
// 直接 @stats47/gis/export からインポートすること。

export { getGisDataSource } from "./config";
export type { GisDataSource } from "./config";

export {
    buildMlitR2Path,
    fetchMlitTopologyFromR2,
    findMlitDataDir,
    getMlitPrefectureTopojsonPath,
    isR2MlitAvailable,
    MLIT_VERSION,
} from "./mlit";

export type { MlitR2PathOptions } from "./mlit";


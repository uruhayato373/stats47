/**
 * e-Stat API Client Entry Point
 * 
 * クライアントコンポーネントから安全にインポートできる（server-onlyを含まない）モジュールのみをエクスポートします。
 */

// Constants
export { ESTAT_STATS_DEFINITIONS } from "./meta-info/constants/definitions";
export type { EstatMetaDefinition } from "./meta-info/types";

// Schemas & Types
export type {
    AreaInfo,
    CategoryInfo,
    CategoryItem,
    EstatMetaInfoListOptions,
    EstatMetaInfoResponse,
    MetaInfoCacheDataR2, TableInfo as MetaTableInfo, ParsedMetaInfo, SaveEstatMetaInfoInput, SavedEstatMetaInfo, TableInfo, TimeAxisInfo
} from "./meta-info/types";
export * from "./stats-data/schemas/stats-data-form.schema";
export type {
    DataNote,
    EstatStatsDataResponse,
    FetchStatsDataResult,
    FormattedEstatData,
    FormattedTableInfo,
    FormattedValue,
    StatsDataSource
} from "./stats-data/types";

// Utils
export {
    buildStatsDataUrl, buildStatsDataUrlParams, convertToStatsSchema, formatStatsData
} from "./stats-data/utils/index";


export * from "./utils/index";

export { ESTAT_STATS_DEFINITIONS } from "./meta-info/constants/definitions";
export * from "./stats-data/schemas/stats-data-form.schema";
export {
    convertToStatsSchema, formatStatsData
} from "./stats-data/utils/index";

// stats-data services
// stats-data services - MOVED TO SERVER
// export { fetchFormattedStats, fetchStatsData } from "./stats-data/index";

// meta-info domain
export type {
    AreaInfo,
    CategoryInfo, EstatMetaInfoListOptions, EstatMetaInfoResponse, MetaInfoCacheDataR2, TableInfo as MetaTableInfo, ParsedMetaInfo, SaveEstatMetaInfoInput, SavedEstatMetaInfo, TimeAxisInfo
} from "./meta-info/types/index";
export { parseCompleteMetaInfo } from "./meta-info/utils/parse-meta-info";

// stats-data domain types
export type {
    DataNote, EstatStatsDataResponse, FetchStatsDataResult, FormattedEstatData,
    FormattedTableInfo, FormattedValue, StatsDataSource
} from "./stats-data/types/index";




/** Node.js pipelines: live API access without Next.js server-only or cache side effects. */
export { fetchMetaInfoFromApi } from "./meta-info/repositories/api/fetch-from-api";
export { fetchStatsDataFromApi } from "./stats-data/repositories/api/fetch-from-api";
export { extractYearCode } from "./stats-data/utils/extract-year-code";
export { parseEstatValue } from "./stats-data/utils/parse-estat-value";
export type { ClassItem, ClassObject } from "./meta-info/types";
export type { EstatStatsDataResponse, EstatValue } from "./stats-data/types";

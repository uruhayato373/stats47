/** Node-only ingestion; keep filesystem credential resolution out of browser barrels. */
export { createEstatIngestClient, resolveEstatAppId, ESTAT_PAGE_LIMIT, ESTAT_MAX_CONCURRENCY } from "./core/client/ingest-client";
export type { EstatIngestClient, IngestResult } from "./core/client/ingest-client";
export { DEFAULT_TABLE_FILE_ROW_LIMIT, readAxes, countSlices, planTablePartitions, makeSliceKey } from "./stats-data/utils/table-partitions";
export type { Axis } from "./stats-data/utils/table-partitions";

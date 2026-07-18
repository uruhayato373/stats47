/**
 * open-data-catalog — e-Stat 外オープンデータの source / dataset カタログ (git TS SSOT)。
 * 管理 agent: open-data-curator / 検証: validate-open-data-catalog.ts + check-open-data-links.ts
 */
export * from "./types";
export { OPEN_DATA_SOURCES, getOpenDataSource } from "./sources";
export { OPEN_DATASETS, getOpenDataset, getDatasetsBySource } from "./datasets";

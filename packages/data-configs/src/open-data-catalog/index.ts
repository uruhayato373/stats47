/**
 * open-data-catalog — e-Stat 外オープンデータの source / dataset カタログの読み込み口。記録の正本は台帳 open-data.sources / open-data.datasets (data/open-data/catalog/)。
 * 管理 agent: open-data-curator / 検証: validate-open-data-catalog.ts + check-open-data-links.ts
 */
export * from "./types";
export * from "./fetch-recipe";
export * from "./snapshot";
export * from "./normalized-table";
export * from "./expansion";
export { OPEN_DATA_SOURCES, getOpenDataSource } from "./sources";
export { OPEN_DATASETS, getOpenDataset, getDatasetsBySource } from "./datasets";

/**
 * MLIT KSJ (国土数値情報) モジュール
 *
 * 国土数値情報のダウンロード・変換・保存パイプラインを提供。
 */

export { runKsjPipeline } from "./pipeline";
export {
  fetchKsjTopologyFromLocal,
  listKsjFiles,
  listDownloadedDatasets,
} from "./adapters/fetch-ksj-from-local";
export type { FetchKsjOptions } from "./adapters/fetch-ksj-from-local";
export { getDatasetDef, listDatasets, KSJ_REGISTRY } from "./registry";
export { buildMlitKsjR2Path, buildMlitKsjLocalPath } from "./r2-path";
export type { MlitKsjR2PathOptions } from "./r2-path";
export type {
  KsjDatasetDef,
  KsjPipelineOptions,
  KsjPipelineResult,
  KsjGeometryType,
  KsjCoverage,
  KsjLicense,
  KsjCategory,
  KsjSimplifyOptions,
} from "./types";

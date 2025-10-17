/**
 * e-STATメタ情報処理モジュール
 * SRP準拠の分離されたクラス群
 */

// 型定義
export type {
  BatchProcessResult,
  BatchProcessOptions,
} from "./batch-processor";

// クラス
export { EstatIdUtils } from "./id-utils";
export { EstatMetaInfoFormatter } from "./formatter";
export { EstatMetaInfoFetcher } from "./fetcher";
export { EstatMetaInfoBatchProcessor } from "./batch-processor";

// ユーティリティ関数
export * from "./utils";

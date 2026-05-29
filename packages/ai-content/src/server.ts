import "server-only";

/**
 * @stats47/ai-content/server
 *
 * サーバーサイド専用: 型定義 + リポジトリ + プロンプト生成を提供。
 */

export type {
  FaqContent,
  FaqItem,
  TrendFaqItem,
  TrendMetrics,
} from "./types";

export type {
  AiContentSnapshotRow,
  AiContentSnapshot,
} from "./types/snapshot";

// 完全DBレス (Phase F): D1 ai_content の repository / snapshot exporter / 生成 CLI は削除。
// runtime は R2 reader readRankingAiContentFromR2 のみ。既存 ai-content (R2) は配信継続、
// 再生成は将来 DBレスな生成パイプライン要 (skill: content/generate-ai-content は要再構築)。
export { readRankingAiContentFromR2 } from "./repositories/read-ranking-ai-content-snapshot";

// プロンプト
export { buildRankingContentPrompt } from "./services/prompts/ranking-content-prompt";
export type { RankingContentInput } from "./services/prompts/ranking-content-prompt";

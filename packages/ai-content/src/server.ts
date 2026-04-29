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
  InsertRankingAiContent,
} from "@stats47/database/schema";

export {
  findRankingAiContent,
  upsertRankingAiContent,
} from "./repositories";

export { readRankingAiContentFromR2 } from "./repositories/read-ranking-ai-content-snapshot";
export { exportRankingAiContentSnapshot } from "./exporters/ranking-ai-content-snapshot";

// プロンプト
export { buildRankingContentPrompt } from "./services/prompts/ranking-content-prompt";
export type { RankingContentInput } from "./services/prompts/ranking-content-prompt";

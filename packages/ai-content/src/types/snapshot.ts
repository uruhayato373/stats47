import type { RankingAiContentRow } from "@stats47/database/schema";

export const AI_CONTENT_SNAPSHOT_KEY = "snapshots/ai-content/all.json";

export interface AiContentSnapshot {
  generatedAt: string;
  count: number;
  rows: RankingAiContentRow[];
}

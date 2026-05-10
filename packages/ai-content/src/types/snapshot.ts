export function aiContentKeyPath(rankingKey: string): string {
  return `app/ranking/${encodeURIComponent(rankingKey)}/ai-content.json`;
}

export interface AiContentSnapshotRow {
  rankingKey: string;
  yearCode: string;
  faq: string | null;
  regionalAnalysis: string | null;
  insights: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** @deprecated aiContentKeyPath を使用してください */
export const AI_CONTENT_SNAPSHOT_KEY = "ai-content/all.json";

/** @deprecated aiContentKeyPath を使用してください */
export interface AiContentSnapshot {
  generatedAt: string;
  count: number;
  rows: AiContentSnapshotRow[];
}

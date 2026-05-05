export const AI_CONTENT_SNAPSHOT_KEY = "snapshots/ai-content/all.json";

export interface AiContentSnapshotRow {
  rankingKey: string;
  yearCode: string;
  faq: string | null;
  regionalAnalysis: string | null;
  insights: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AiContentSnapshot {
  generatedAt: string;
  count: number;
  rows: AiContentSnapshotRow[];
}

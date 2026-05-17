export function aiContentKeyPath(rankingKey: string): string {
  return `app/ranking/${encodeURIComponent(rankingKey)}/ai-content.json`;
}

export interface AiContentSnapshotRow {
  rankingKey: string;
  yearCode: string;
  faq: string | null;
  regionalAnalysis: string | null;
  insights: string | null;
  /** 47 都道府県別解説 (PrefectureCommentaryContent を JSON 化した文字列) */
  prefectureCommentary: string | null;
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

import { RANKING_R2_PREFIX, rankingR2Key } from "@stats47/r2-storage/keys";
export function aiContentKeyPath(rankingKey: string): string {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rankingKey)
    ? rankingR2Key(rankingKey, "ai-content")
    : `${RANKING_R2_PREFIX}/${encodeURIComponent(rankingKey)}/ai-content.json`;
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

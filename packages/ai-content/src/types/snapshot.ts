export const AI_CONTENT_SNAPSHOT_KEY = "snapshots/ai-content/all.json";

/**
 * R2 snapshot に出力する 1 行。schema-agnostic な形を維持し、DB 内部の
 * テーブル変遷 (旧 ranking_ai_content → 新 ai_content) から独立させる。
 *
 * フィールドは旧 ranking_ai_content の SELECT 結果と互換 (rankingKey / areaType を含む)。
 */
export interface AiContentSnapshotRow {
  rankingKey: string;
  areaType: string;
  faq: string | null;
  regionalAnalysis: string | null;
  insights: string | null;
  yearCode: string;
  aiModel: string;
  promptVersion: string;
  generatedAt: string;
  isActive: boolean | null;
  isProofread: boolean | null;
  proofreadAt: string | null;
  editorialSource: string | null;
  reviewedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AiContentSnapshot {
  generatedAt: string;
  count: number;
  rows: AiContentSnapshotRow[];
}

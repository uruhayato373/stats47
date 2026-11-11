/**
 * 白書・報告書を Theme の指標と周遊導線へ接続する論点レンズの読み込み口。
 *
 * EvidenceLens は公開 URL を持つ第4分類軸ではない。Theme 内で「何を問うか」を
 * 揃える従属メタデータで、採択済みの問いだけを ThemeCatalog.evidenceTopics から参照する。
 * 記録の正本は台帳 `themes.evidence-lenses` (JSON + Schema)。ここは型付けして export するだけで、記録を持たない。
 */
import data from "../../../../data/themes/viewpoints/evidence-lenses.json";

export interface EvidenceLensDefinition {
  label: string;
  description: string;
}

export const EVIDENCE_LENS_CATALOG: { [K in keyof typeof data.lenses]: EvidenceLensDefinition } = data.lenses;

export type EvidenceLensKey = keyof typeof EVIDENCE_LENS_CATALOG;

export interface EvidenceSourceDefinition {
  kind: "whitepaper" | "report" | "statistical-overview";
  title: string;
  publisher: string;
  sourceUrl: string;
  /** NotebookLM 側の名前。ID は確認できた場合だけ設定する。 */
  notebookName?: string;
  notebookId?: string;
  /** whitepaper-chart-inventory で使う slug。未棚卸しなら省略する。 */
  inventorySlug?: string;
}

export const EVIDENCE_SOURCE_CATALOG = data.sources as { [K in keyof typeof data.sources]: EvidenceSourceDefinition };

export type EvidenceSourceKey = keyof typeof EVIDENCE_SOURCE_CATALOG;

/** グループ一覧が必要とする最小限の項目。CategoryRankingItem からの転記 */
export interface CategoryTopicListItem {
  rankingKey: string;
  title: string;
  readerLabel?: string | null;
  subtitle: string | null;
  unit: string;
  /** カテゴリ内グループのキー。未分類 (旧 snapshot) は null */
  topicKey: string | null;
  /** 最新年の 1 位。欠損時は行の右側を出さない */
  top1: { areaName: string; value: string | null } | null;
}

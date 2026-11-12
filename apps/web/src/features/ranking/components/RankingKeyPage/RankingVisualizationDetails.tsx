interface RankingVisualizationDetailsProps {
  description?: string | null;
}

/** 地図・テーブルの双方に共通する集計条件。更新日はページ見出し、出典は末尾の一覧に置く。 */
export function RankingVisualizationDetails({
  description,
}: RankingVisualizationDetailsProps) {
  if (!description) return null;

  return (
    <section
      aria-label="このデータについて"
      className="space-y-1 leading-relaxed"
    >
      <p>{description}</p>
    </section>
  );
}

interface RankingVisualizationDetailsProps {
  description?: string | null;
  updatedAt?: string | null;
}

/** 地図・テーブルの双方に共通する集計条件と鮮度情報。パネルの補足 (ChartPanel の footer) の中に置く。 */
export function RankingVisualizationDetails({
  description,
  updatedAt,
}: RankingVisualizationDetailsProps) {
  if (!description && !updatedAt) return null;

  return (
    <section
      aria-label="このデータについて"
      className="space-y-1 leading-relaxed"
    >
      {description && <p>{description}</p>}
      {updatedAt && <p>最終更新 {updatedAt}</p>}
    </section>
  );
}

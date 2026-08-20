interface RankingVisualizationDetailsProps {
  description?: string | null;
  updatedAt?: string | null;
}

/** 地図・テーブルの双方に共通する集計条件と鮮度情報。 */
export function RankingVisualizationDetails({
  description,
  updatedAt,
}: RankingVisualizationDetailsProps) {
  if (!description && !updatedAt) return null;

  return (
    <section
      aria-label="このデータについて"
      className="mt-3 space-y-1 text-sm leading-relaxed text-muted-foreground"
    >
      {description && <p>{description}</p>}
      {updatedAt && <p>最終更新 {updatedAt}</p>}
    </section>
  );
}

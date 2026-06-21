import { Suspense } from "react";

import { CorrelationSectionContainer } from "../CorrelationSection/CorrelationSectionContainer";
import { CorrelationSectionSkeleton } from "../CorrelationSection/CorrelationSectionSkeleton";
import { RankingPageCardsContainer } from "../RankingPageCards/RankingPageCardsContainer";
import { RankingPageCardsSkeleton } from "../RankingPageCards/RankingPageCardsSkeleton";

interface RankingPageAsyncSectionProps {
  rankingKey: string;
}

export function RankingPageCorrelationSection({
  rankingKey,
}: RankingPageAsyncSectionProps) {
  return (
    <Suspense fallback={<CorrelationSectionSkeleton />}>
      <CorrelationSectionContainer rankingKey={rankingKey} />
    </Suspense>
  );
}

export function RankingPageSupplementCardsSection({
  rankingKey,
}: RankingPageAsyncSectionProps) {
  return (
    <Suspense fallback={<RankingPageCardsSkeleton />}>
      <RankingPageCardsContainer rankingKey={rankingKey} />
    </Suspense>
  );
}

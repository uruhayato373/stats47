'use client';

import { useEffect } from 'react';

import { trackRankingView } from '@/lib/analytics/events';

interface Props {
  rankingKey: string;
  title: string;
  yearCode: string;
}

export function MunicipalityRankingViewTracker({
  rankingKey,
  title,
  yearCode,
}: Props) {
  useEffect(() => {
    trackRankingView({
      rankingKey,
      title,
      areaType: 'city',
      yearCode,
    });
  }, [rankingKey, title, yearCode]);
  return null;
}

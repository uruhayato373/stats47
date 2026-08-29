'use client';

import { useEffect, useRef } from 'react';

import { trackGeoAnalysisView } from '@/lib/analytics/events';

interface Props {
  analysisId: string;
  analysisSlug: string;
  geography: 'prefecture' | 'municipality' | 'mesh';
  dataVersion: string;
}

export function GeoAnalysisTracker(props: Props) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackGeoAnalysisView(props);
  }, [props]);

  return null;
}

import React, { useEffect, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';
import type { Topology } from 'topojson-specification';

import { computeBuzzMapGeo, type BuzzMapGeo } from '@/features/buzz-map/geo';
import { GeoInsightCard, type GeoInsightCardProps } from '../GeoInsightCard';

export const GeoInsightCardPreview: React.FC<GeoInsightCardProps> = (props) => {
  const [handle] = useState(() => delayRender('Loading prefecture TopoJSON'));
  const [mapGeo, setMapGeo] = useState<BuzzMapGeo>();

  useEffect(() => {
    let cancelled = false;
    async function loadMap() {
      try {
        const response = await fetch(staticFile('prefecture.topojson'));
        const topology = (await response.json()) as Topology;
        if (cancelled) return;
        setMapGeo(
          computeBuzzMapGeo(topology, null, {
            level: 'pref',
            ratio: '45',
            type: 'A',
          })
        );
      } finally {
        continueRender(handle);
      }
    }
    void loadMap();
    return () => {
      cancelled = true;
    };
  }, [handle, props.allEntries]);

  return <GeoInsightCard {...props} mapGeo={mapGeo} />;
};

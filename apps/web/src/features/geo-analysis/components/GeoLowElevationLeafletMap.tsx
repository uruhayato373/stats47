'use client';
import { useMemo, useState } from 'react';

import { Button } from '@stats47/components/atoms/ui/button';
import { GeoJSON } from 'react-leaflet';

import { LeafletMapFrame } from '@/components/charts/LeafletMapFrame';

import {
  buildGeoLowElevationMapModel,
  lowElevationTooltip,
  type LowElevationBasis,
} from '../lib/build-geo-low-elevation-map-model';
import { populationLayerColor } from '../lib/geo-layer-data';
import { GEO_MAP_COLORS } from '../lib/geo-map.palette';

import type { GeoLowElevationPrefDetail } from '@stats47/gis';

export function GeoLowElevationLeafletMap({
  detail,
  view,
}: {
  detail: GeoLowElevationPrefDetail;
  view: 'population' | 'overlap';
}) {
  const model = useMemo(() => buildGeoLowElevationMapModel(detail), [detail]);
  const focus = useMemo(
    () => ({ center: model.center, zoom: 10, label: '人口最多メッシュ周辺' }),
    [model]
  );
  const [basis, setBasis] = useState<LowElevationBasis>('mean');
  return (
    <LeafletMapFrame
      ariaLabel={`${detail.areaName}の1kmメッシュ人口と平均標高`}
      bounds={model.bounds}
      focus={focus}
      toolbar={
        view === 'overlap' ? (
          <>
            <Button
              size="sm"
              variant={basis === 'mean' ? 'default' : 'outline'}
              aria-pressed={basis === 'mean'}
              onClick={() => setBasis('mean')}
            >
              平均標高で区分
            </Button>
            <Button
              size="sm"
              variant={basis === 'min' ? 'default' : 'outline'}
              aria-pressed={basis === 'min'}
              onClick={() => setBasis('min')}
            >
              最低標高で区分（上限側）
            </Button>
          </>
        ) : null
      }
    >
      <GeoJSON
        key={`${detail.areaCode}-${view}-${basis}`}
        data={model.collection}
        style={(feature) => {
          const properties = feature?.properties ?? {};
          const band = Number(
            basis === 'min' ? properties.minBand : properties.meanBand
          );
          return {
            color: GEO_MAP_COLORS.outline,
            weight: 0.3,
            fillOpacity: 0.7,
            fillColor:
              view === 'overlap'
                ? (GEO_MAP_COLORS.lowElevationBands[band] ??
                  GEO_MAP_COLORS.lowElevationBands[0])
                : populationLayerColor(Number(properties.population2020)),
          };
        }}
        onEachFeature={(feature, layer) => {
          const node = document.createElement('span');
          node.textContent = lowElevationTooltip(feature.properties);
          layer.bindTooltip(node, { sticky: true });
          layer.bindPopup(node.cloneNode(true) as HTMLElement);
        }}
      />
    </LeafletMapFrame>
  );
}

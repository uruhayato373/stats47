'use client';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@stats47/components/atoms/ui/button';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';

import {
  buildGeoLowElevationMapModel,
  lowElevationTooltip,
  type LowElevationBasis,
} from '../lib/build-geo-low-elevation-map-model';
import { createGeoCanvasRenderer } from '../lib/create-geo-canvas-renderer';
import { GEO_BASEMAP } from '../lib/geo-basemap';
import { populationLayerColor } from '../lib/geo-layer-data';
import { GEO_MAP_COLORS } from '../lib/geo-map.palette';

import type { GeoLowElevationPrefDetail } from '@stats47/gis';

function Fit({
  center,
  bounds,
  extent,
}: {
  center: [number, number];
  bounds: [[number, number], [number, number]];
  extent: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (extent) map.fitBounds(bounds, { padding: [16, 16], maxZoom: 11 });
    else map.setView(center, 10);
  }, [map, center, bounds, extent]);
  return null;
}

export function GeoLowElevationLeafletMap({
  detail,
  view,
}: {
  detail: GeoLowElevationPrefDetail;
  view: 'population' | 'overlap';
}) {
  const renderer = useState(() => createGeoCanvasRenderer())[0];
  const model = useMemo(() => buildGeoLowElevationMapModel(detail), [detail]);
  const [extent, setExtent] = useState(false);
  const [basis, setBasis] = useState<LowElevationBasis>('mean');
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={extent ? 'outline' : 'default'}
          aria-pressed={!extent}
          onClick={() => setExtent(false)}
        >
          人口最多メッシュ周辺
        </Button>
        <Button
          size="sm"
          variant={extent ? 'default' : 'outline'}
          aria-pressed={extent}
          onClick={() => setExtent(true)}
        >
          離島を含む全県
        </Button>
        {view === 'overlap' ? (
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
        ) : null}
      </div>
      <MapContainer
        renderer={renderer}
        preferCanvas
        center={model.center}
        zoom={10}
        zoomAnimation={false}
        minZoom={GEO_BASEMAP.minZoom}
        maxZoom={GEO_BASEMAP.maxZoom}
        scrollWheelZoom={false}
        className="isolate h-[480px] rounded-card lg:h-[620px]"
        aria-label={`${detail.areaName}の1kmメッシュ人口と平均標高`}
      >
        <TileLayer url={GEO_BASEMAP.url} attribution={GEO_BASEMAP.attribution} />
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
        <Fit center={model.center} bounds={model.bounds} extent={extent} />
      </MapContainer>
    </div>
  );
}

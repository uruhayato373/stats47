'use client';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@stats47/components/atoms/ui/button';
import L from 'leaflet';
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import { fitGeoSourceBounds } from '../lib/fit-geo-source-bounds';
import {
  GEO_BASEMAP,
  GEO_BASEMAP_SHORELINE_ATTRIBUTION,
} from '../lib/geo-basemap';
import {
  formatGeoSourceProperty,
  visibleGeoSourceFields,
} from '../lib/geo-source-properties';

import type { GeoSourceField } from '@stats47/data-configs/business-plan';
import type { FeatureCollection } from 'geojson';

type MapStatus =
  | {
      total: number;
      matched: number;
      displayed: number;
    }
  | { error: string }
  | null;

function SourceContent({
  url,
  fields,
  onBounds,
  onStatus,
}: {
  url: string;
  fields: GeoSourceField[];
  onBounds: (bounds: L.LatLngBoundsExpression) => void;
  onStatus: (status: MapStatus) => void;
}) {
  const map = useMap();
  const worker = useRef<Worker | null>(null);
  const [result, setResult] = useState<{
    collection: FeatureCollection;
    matched: number;
    total: number;
    revision: number;
  } | null>(null);
  const sendView = () => {
    const b = map.getBounds();
    worker.current?.postMessage({
      type: 'view',
      bounds: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
    });
  };
  useMapEvents({ moveend: sendView });
  useEffect(() => {
    const instance = new Worker(
      new URL('../lib/geo-source-worker.ts', import.meta.url)
    );
    worker.current = instance;
    const container = map.getContainer();
    let initialBounds: L.LatLngBoundsExpression | null = null;
    let hasFitted = false;
    const syncSize = () => {
      // Hidden tabs/panels have no usable viewport; fit only after they appear.
      if (!container.clientWidth || !container.clientHeight) return;
      map.invalidateSize({ animate: false, debounceMoveend: true });
      if (!initialBounds) return;
      if (!hasFitted) {
        hasFitted = true;
        fitGeoSourceBounds(map, initialBounds);
      }
      sendView();
    };
    const resizeObserver = new ResizeObserver(syncSize);
    resizeObserver.observe(container);
    instance.onmessage = ({ data }) => {
      if (data.type === 'ready') {
        const bounds: L.LatLngBoundsExpression = [
          [data.bounds[1], data.bounds[0]],
          [data.bounds[3], data.bounds[2]],
        ];
        initialBounds = bounds;
        onBounds(bounds);
        syncSize();
      }
      if (data.type === 'view') {
        setResult((previous) => ({
          ...data,
          revision: (previous?.revision ?? 0) + 1,
        }));
        onStatus({
          total: data.total,
          matched: data.matched,
          displayed: data.collection.features.length,
        });
      }
      if (data.type === 'error') onStatus({ error: data.message });
    };
    instance.onerror = () =>
      onStatus({
        error:
          '地図を処理できませんでした。ページを再読み込みし、別の配布区画でもお試しください。',
      });
    instance.postMessage({ type: 'load', url });
    return () => {
      resizeObserver.disconnect();
      instance.terminate();
      worker.current = null;
    };
    // The worker and map share this lifecycle; url changes remount the component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, url]);
  return (
    <>
      {result && (
        <GeoJSON
          key={result.revision}
          data={result.collection}
          style={{
            color: '#2563eb',
            weight: 1.5,
            fillColor: '#60a5fa',
            fillOpacity: 0.35,
          }}
          pointToLayer={(_f, ll) =>
            L.circleMarker(ll, {
              radius: 5,
              color: '#1e40af',
              weight: 1,
              fillOpacity: 0.8,
            })
          }
          onEachFeature={(feature, layer) => {
            const box = document.createElement('div');
            for (const field of visibleGeoSourceFields(
              fields,
              feature.properties ?? {}
            )) {
              const row = document.createElement('p');
              row.textContent = `${field.label}：${formatGeoSourceProperty(field, feature.properties ?? {})}`;
              box.append(row);
            }
            const raw = document.createElement('details');
            const summary = document.createElement('summary');
            summary.textContent = '原典の全属性';
            raw.append(summary);
            for (const [key, value] of Object.entries(
              feature.properties ?? {}
            )) {
              const row = document.createElement('p');
              row.textContent = `${key}：${typeof value === 'object' ? JSON.stringify(value) : String(value)}`;
              (fields.length ? raw : box).append(row);
            }
            if (fields.length) box.append(raw);
            if (!box.childNodes.length) box.textContent = '属性情報なし';
            box.style.maxHeight = '180px';
            box.style.overflowY = 'auto';
            box.style.overflowWrap = 'anywhere';
            layer.bindPopup(box, {
              maxWidth: 200,
              minWidth: 120,
              autoPanPadding: [8, 8],
              keepInView: true,
            });
          }}
        />
      )}
    </>
  );
}
export function GeoSourceMap({
  url,
  label,
  fields = [],
}: {
  url: string;
  label: string;
  fields?: GeoSourceField[];
}) {
  const map = useRef<L.Map | null>(null);
  const [bounds, setBounds] = useState<L.LatLngBoundsExpression | null>(null);
  const [status, setStatus] = useState<MapStatus>(null);
  const error = status && 'error' in status ? status.error : '';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">
          表示中：{label}
        </p>
        <Button
          variant="outline"
          className="min-h-11 shrink-0"
          disabled={!bounds || !!error}
          onClick={() => {
            map.current?.closePopup();
            if (bounds && map.current) fitGeoSourceBounds(map.current, bounds);
          }}
        >
          区画全体に戻す
        </Button>
      </div>
      <div className="relative z-0 overflow-hidden">
        <MapContainer
          ref={map}
          center={[36, 138]}
          zoom={5}
          minZoom={0}
          scrollWheelZoom={false}
          preferCanvas
          className="h-[420px] w-full sm:h-[560px] [&_.leaflet-control-zoom_a]:!h-11 [&_.leaflet-control-zoom_a]:!w-11 [&_.leaflet-control-zoom_a]:!leading-[44px]"
        >
          <TileLayer
            url={GEO_BASEMAP.url}
            attribution={GEO_BASEMAP.attribution}
            minNativeZoom={GEO_BASEMAP.minNativeZoom}
            maxZoom={17}
          />
          <SourceContent
            url={url}
            fields={fields}
            onBounds={setBounds}
            onStatus={setStatus}
          />
        </MapContainer>
      </div>
      <p
        className="text-xs leading-relaxed text-muted-foreground"
        role={error ? 'alert' : 'status'}
      >
        {error ||
          (!status
            ? '地図データを読み込んでいます…'
            : 'total' in status &&
              `区画内 ${status.total.toLocaleString('ja-JP')}地物／表示対象候補 ${status.matched.toLocaleString('ja-JP')}地物${status.matched > status.displayed ? `。うち${status.displayed}地物を表示中。拡大すると表示対象を絞れます。` : '。青い地物をタップして属性を確認。'}`)}
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {GEO_BASEMAP_SHORELINE_ATTRIBUTION}
      </p>
    </div>
  );
}

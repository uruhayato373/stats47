'use client';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';

import L from 'leaflet';
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import { GEO_BASEMAP } from '../lib/geo-basemap';
import {
  formatGeoSourceProperty,
  visibleGeoSourceFields,
} from '../lib/geo-source-properties';

import type { GeoSourceField } from '@stats47/data-configs/business-plan';
import type { FeatureCollection } from 'geojson';

function SourceContent({
  url,
  fields,
}: {
  url: string;
  fields: GeoSourceField[];
}) {
  const map = useMap();
  const worker = useRef<Worker | null>(null);
  const [result, setResult] = useState<{
    collection: FeatureCollection;
    matched: number;
    total: number;
    revision: number;
  } | null>(null);
  const [error, setError] = useState('');
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
    instance.onmessage = ({ data }) => {
      if (data.type === 'ready') {
        map.fitBounds(
          [
            [data.bounds[1], data.bounds[0]],
            [data.bounds[3], data.bounds[2]],
          ],
          { padding: [18, 18], maxZoom: 13, animate: false }
        );
        sendView();
      }
      if (data.type === 'view')
        setResult((previous) => ({
          ...data,
          revision: (previous?.revision ?? 0) + 1,
        }));
      if (data.type === 'error') setError(data.message);
    };
    instance.onerror = () =>
      setError(
        '地図を処理できませんでした。ページを再読み込みし、別の配布区画でもお試しください。'
      );
    instance.postMessage({ type: 'load', url });
    return () => {
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
      <div
        className="absolute bottom-7 left-2 right-2 z-[1000] border bg-background/95 p-2 text-xs"
        role={error ? 'alert' : 'status'}
      >
        {error ||
          (!result
            ? '地図データを読み込んでいます…'
            : `区画内 ${result.total.toLocaleString('ja-JP')}地物／表示対象候補 ${result.matched.toLocaleString('ja-JP')}地物${result.matched > result.collection.features.length ? `。うち${result.collection.features.length}地物を表示中。拡大すると表示対象を絞れます。` : '。青い地物をタップして属性を確認。'}`)}
      </div>
    </>
  );
}
export function GeoSourceMap({
  url,
  fields = [],
}: {
  url: string;
  fields?: GeoSourceField[];
}) {
  return (
    <div className="relative z-0 overflow-hidden">
      <MapContainer
        center={[36, 138]}
        zoom={5}
        minZoom={3}
        scrollWheelZoom={false}
        preferCanvas
        className="h-[420px] w-full sm:h-[560px]"
      >
        <TileLayer
          url={GEO_BASEMAP.url}
          attribution={GEO_BASEMAP.attribution}
          maxZoom={17}
        />
        <SourceContent url={url} fields={fields} />
      </MapContainer>
    </div>
  );
}

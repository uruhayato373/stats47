'use client';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@stats47/components/atoms/ui/button';
import {
  KSJ_UNCLASSIFIED_COLOR,
  KSJ_UNCLASSIFIED_KEY,
  classifyKsjFeature,
  type KsjAttributeClassification,
} from '@stats47/gis/mlit-ksj/classifications';
import L from 'leaflet';
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import { ChartLegend } from '@/components/charts/ChartLegend';

import { fitGeoSourceBounds } from '../lib/fit-geo-source-bounds';
import {
  GEO_BASEMAP,
  GEO_BASEMAP_SHORELINE_ATTRIBUTION,
} from '../lib/geo-basemap';
import { GEO_MAP_COLORS } from '../lib/geo-map.palette';
import {
  formatGeoSourceProperty,
  visibleGeoSourceFields,
} from '../lib/geo-source-properties';
import { resolveCssColor } from '../lib/resolve-css-color';


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

/** 区分の台帳で地物を色分けするときの色。区分の無い地物は既定の色で描く */
function useClassColors(classification: KsjAttributeClassification | null) {
  return useMemo(() => {
    if (!classification) return null;
    return {
      byCode: new Map(classification.classes.map((item) => [item.code, resolveCssColor(item.color)])),
      unclassified: resolveCssColor(KSJ_UNCLASSIFIED_COLOR),
    };
  }, [classification]);
}

function SourceContent({
  url,
  fields,
  classification,
  hiddenCodes,
  onBounds,
  onStatus,
}: {
  url: string;
  fields: GeoSourceField[];
  classification: KsjAttributeClassification | null;
  hiddenCodes: ReadonlySet<string>;
  onBounds: (bounds: L.LatLngBoundsExpression) => void;
  onStatus: (status: MapStatus) => void;
}) {
  const map = useMap();
  const classColors = useClassColors(classification);
  // 区分の色 (区分を持たないデータは従来の 1 色)。表示を切った区分は描かない
  const colorOf = (properties: Record<string, unknown> | null | undefined) => {
    if (!classification || !classColors) return null;
    const item = classifyKsjFeature(classification, properties);
    return item ? (classColors.byCode.get(item.code) ?? classColors.unclassified) : classColors.unclassified;
  };
  const isShown = (properties: Record<string, unknown> | null | undefined) => {
    if (!classification || hiddenCodes.size === 0) return true;
    const item = classifyKsjFeature(classification, properties);
    return !hiddenCodes.has(item ? item.code : KSJ_UNCLASSIFIED_KEY);
  };
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
          key={`${result.revision}-${[...hiddenCodes].join(',')}`}
          data={result.collection}
          filter={(feature) => isShown(feature.properties)}
          style={(feature) => {
            const color = colorOf(feature?.properties);
            return {
              color: color ?? GEO_MAP_COLORS.sourceResult.stroke,
              weight: 1.5,
              fillColor: color ?? GEO_MAP_COLORS.sourceResult.fill,
              fillOpacity: color ? 0.6 : 0.35,
            };
          }}
          pointToLayer={(feature, ll) =>
            L.circleMarker(ll, {
              radius: 5,
              color: colorOf(feature.properties) ?? GEO_MAP_COLORS.sourceResult.point,
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
  classification = null,
}: {
  url: string;
  label: string;
  fields?: GeoSourceField[];
  /** 区分の台帳 (`@stats47/gis/mlit-ksj/classifications`)。あれば色分けし、凡例で表示を切り替える */
  classification?: KsjAttributeClassification | null;
}) {
  const [hiddenCodes, setHiddenCodes] = useState<ReadonlySet<string>>(() => new Set());
  const toggleClass = (code: string) =>
    setHiddenCodes((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  const map = useRef<L.Map | null>(null);
  const [bounds, setBounds] = useState<L.LatLngBoundsExpression | null>(null);
  const [status, setStatus] = useState<MapStatus>(null);
  const error = status && 'error' in status ? status.error : '';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 text-sm font-medium wrap-anywhere">
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
          className="h-[420px] w-full sm:h-[560px] [&_.leaflet-control-zoom_a]:h-11! [&_.leaflet-control-zoom_a]:w-11! [&_.leaflet-control-zoom_a]:leading-[44px]!"
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
            classification={classification}
            hiddenCodes={hiddenCodes}
            onBounds={setBounds}
            onStatus={setStatus}
          />
        </MapContainer>
      </div>
      {classification && (
        <ChartLegend
          layout="list"
          label={`表示する${classification.label}`}
          className="grid gap-x-6 sm:grid-cols-2"
          items={[
            ...classification.classes.map((item) => ({ key: item.code, label: item.label, color: item.color })),
            // 原典で区分の属性を持たない地物 (空港の標点など)。隠すと区分のある地物だけを見られる
            { key: KSJ_UNCLASSIFIED_KEY, label: '区分のない地物', color: KSJ_UNCLASSIFIED_COLOR },
          ]}
          hiddenKeys={hiddenCodes}
          onToggle={toggleClass}
        />
      )}
      <p
        className="text-xs leading-relaxed text-muted-foreground"
        role={error ? 'alert' : 'status'}
      >
        {error ||
          (!status
            ? '地図データを読み込んでいます…'
            : 'total' in status &&
              `区画内 ${status.total.toLocaleString('ja-JP')}地物／表示対象候補 ${status.matched.toLocaleString('ja-JP')}地物${status.matched > status.displayed ? `。うち${status.displayed}地物を表示中。拡大すると表示対象を絞れます。` : classification ? '。地物をタップして属性を確認。' : '。青い地物をタップして属性を確認。'}`)}
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {GEO_BASEMAP_SHORELINE_ATTRIBUTION}
      </p>
    </div>
  );
}

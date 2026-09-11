'use client';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@stats47/components/atoms/ui/button';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';

import { fetchGeoSnowSourceAction } from '../actions';
import {
  buildGeoSnowMapModel,
  SNOW_CLASS_LABELS,
} from '../lib/build-geo-snow-map-model';
import { createGeoCanvasRenderer } from '../lib/create-geo-canvas-renderer';
import { GEO_BASEMAP } from '../lib/geo-basemap';

import type {
  GeoSnowPrefDetail,
  GeoAnalysisEvidenceManifest,
} from '@stats47/gis';
import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';
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
export function GeoSnowDesignationLeafletMap({
  detail,
  view,
  manifest,
}: {
  detail: GeoSnowPrefDetail;
  view: 'population' | 'overlap';
  manifest: GeoAnalysisEvidenceManifest;
}) {
  const renderer = useState(() => createGeoCanvasRenderer())[0];
  const model = useMemo(() => buildGeoSnowMapModel(detail), [detail]);
  const [extent, setExtent] = useState(false),
    [showSource, setShowSource] = useState(true);
  const [source, setSource] = useState<FeatureCollection<
      Polygon | MultiPolygon
    > | null>(null),
    [sourceState, setSourceState] = useState<'loading' | 'ready' | 'error'>(
      'loading'
    );
  const artifact = manifest.stages
    .find((s) => s.id === 'snow-designation-polygons')
    ?.outputs.find((o) => o.areaCode === detail.areaCode);
  useEffect(() => {
    let active = true;
    if (view !== 'overlap' || !showSource) return;
    void (
      artifact
        ? fetchGeoSnowSourceAction(detail.areaCode.slice(0, 2), {
            generatedAt: manifest.generatedAt,
            sha256: artifact.sha256,
          })
        : Promise.resolve(null)
    )
      .then((value) => {
        if (active) {
          setSource(value);
          setSourceState(value ? 'ready' : 'error');
        }
      })
      .catch(() => {
        if (active) setSourceState('error');
      });
    return () => {
      active = false;
    };
  }, [detail.areaCode, manifest.generatedAt, artifact, view, showSource]);
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={extent ? 'outline' : 'default'}
          onClick={() => setExtent(false)}
        >
          人口最多メッシュ周辺
        </Button>
        <Button
          size="sm"
          variant={extent ? 'default' : 'outline'}
          onClick={() => setExtent(true)}
        >
          離島を含む全県
        </Button>
        {view === 'overlap' ? (
          <Button
            size="sm"
            variant="outline"
            aria-pressed={showSource}
            onClick={() => {
              if (!showSource) { setSource(null); setSourceState('loading'); }
              setShowSource((v) => !v);
            }}
          >
            原典の指定境界{showSource ? 'を隠す' : 'を表示'}
          </Button>
        ) : null}
      </div>
      {view === 'overlap' && showSource && sourceState !== 'ready' ? (
        <p role="status" className="mb-2 text-xs text-muted-foreground">
          {sourceState === 'loading'
            ? '指定境界を読み込んでいます…'
            : '指定境界を取得できません。人口メッシュの判定結果は表示しています。'}
        </p>
      ) : null}
      <MapContainer
        renderer={renderer}
        preferCanvas
        center={model.center}
        zoom={10}
        zoomAnimation={false}
        minZoom={GEO_BASEMAP.minZoom}
        maxZoom={GEO_BASEMAP.maxZoom}
        scrollWheelZoom={false}
        className="isolate h-[480px] rounded-none lg:h-[620px]"
        aria-label={`${detail.areaName}の豪雪指定区域と250m人口メッシュ`}
      >
        <TileLayer
          url={GEO_BASEMAP.url}
          attribution={GEO_BASEMAP.attribution}
        />
        <GeoJSON
          key={`${detail.areaCode}-${view}`}
          data={model.collection}
          style={(f) => ({
            color: f?.properties?.boundaryCell ? '#334155' : '#ffffff',
            weight: f?.properties?.boundaryCell ? 0.6 : 0.2,
            fillOpacity: 0.65,
            fillColor:
              view === 'overlap'
                ? (['#cbd5e1', '#2563eb', '#7e22ce'][
                    Number(f?.properties?.centerClass)
                  ] ?? '#cbd5e1')
                : Number(f?.properties?.population2020) >= 1000
                  ? '#1e3a8a'
                  : Number(f?.properties?.population2020) >= 100
                    ? '#2563eb'
                    : '#93c5fd',
          })}
          onEachFeature={(f, layer) => {
            const p = f.properties,
              n = document.createElement('span');
            n.textContent = `メッシュ ${p.meshCode}｜2020年基準人口 ${Number(p.population2020).toLocaleString('ja-JP', { maximumFractionDigits: 4 })}人｜${SNOW_CLASS_LABELS[Number(p.centerClass)]}${p.boundaryCell ? '｜指定境界を横切る格子' : ''}`;
            layer.bindTooltip(n, { sticky: true });
            layer.bindPopup(n.cloneNode(true) as HTMLElement);
          }}
        />
        {view === 'overlap' && showSource && source ? (
          <GeoJSON
            key={`source-${detail.areaCode}`}
            data={source}
            style={(f) => ({
              color: Number(f?.properties?.class) === 2 ? '#7e22ce' : '#1e40af',
              weight: 1.5,
              fill: false,
              interactive: false,
            })}
          />
        ) : null}
        <Fit center={model.center} bounds={model.bounds} extent={extent} />
      </MapContainer>
    </div>
  );
}

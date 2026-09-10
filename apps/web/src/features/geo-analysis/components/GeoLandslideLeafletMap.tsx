'use client';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { Button } from '@stats47/components/atoms/ui/button';
import { circleMarker } from 'leaflet';
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import { fetchGeoLandslideSourceAction } from '../actions';
import {
  buildGeoLandslideMapModel,
  LANDSLIDE_CLASS_LABELS,
} from '../lib/build-geo-landslide-map-model';
import { createGeoCanvasRenderer } from '../lib/create-geo-canvas-renderer';
import { GEO_BASEMAP } from '../lib/geo-basemap';

import type {
  GeoLandslidePrefDetail,
  GeoAnalysisEvidenceManifest,
} from '@stats47/gis';
import type { FeatureCollection, Polygon } from 'geojson';
function Source({ manifest }: { manifest: GeoAnalysisEvidenceManifest }) {
  const [revision, setRevision] = useState(0);
  const map = useMapEvents({ moveend: () => setRevision((n) => n + 1) });
  if (map.getZoom() < 11) return <SourceStatus>区域面の境界はズーム11以上で読み込みます。</SourceStatus>;
  const b = map.getBounds();
  const bounds = [Math.max(122,b.getWest()),Math.max(20,b.getSouth()),Math.min(154,b.getEast()),Math.min(46,b.getNorth())] as const;
  return <SourceViewport key={`${revision}:${manifest.generatedAt}`} bounds={bounds} generatedAt={manifest.generatedAt} />;
}
function SourceStatus({children}:{children:ReactNode}) {
  return <div className="leaflet-bottom leaflet-left z-[500] m-2 bg-background p-2 text-xs" role="status">{children}</div>;
}
function SourceViewport({bounds,generatedAt}:{bounds:readonly [number,number,number,number];generatedAt:string}) {
  const [source, setSource] = useState<FeatureCollection<Polygon> | null>(null);
  const [status, setStatus] = useState('表示範囲の区域面を読み込んでいます。');
  useEffect(() => {
    let active = true;
    void fetchGeoLandslideSourceAction(bounds, { generatedAt })
      .then((r) => {
        if (!active) return;
        if (r.status === 'ready') {
          setSource(r.collection);
          setStatus('原典区域面を表示しています。計算後の表示用簡略化です。');
        } else setStatus(r.status === 'zoom-in'
          ? '対象面が多いため、さらに拡大してください。区域面を省略表示していません。'
          : '区域面を取得できません。人口・施設の判定結果は表示しています。');
      })
      .catch(() => { if (active) setStatus('区域面を取得できません。'); });
    return () => { active = false; };
  }, [bounds, generatedAt]);
  return <>
    {source ? <GeoJSON data={source} style={(f) => ({
      color: Number(f?.properties?.mask) >= 8 ? '#7e22ce' : '#1e40af',
      weight: 1.2, fill: false, interactive: false,
    })} /> : null}
    <SourceStatus>{status}</SourceStatus>
  </>;
}
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
export function GeoLandslideLeafletMap({
  detail,
  view,
  manifest,
}: {
  detail: Extract<GeoLandslidePrefDetail, { status: 'available' }>;
  view: 'population' | 'overlap' | 'facilities';
  manifest: GeoAnalysisEvidenceManifest;
}) {
  const renderer = useState(() => createGeoCanvasRenderer())[0],
    model = useMemo(() => buildGeoLandslideMapModel(detail), [detail]);
  const [extent, setExtent] = useState(false),
    [source, setSource] = useState(false);
  const facilities = useMemo<FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: detail.facilities.map((f) => ({
        type: 'Feature',
        id: f[0],
        properties: {
          name: f[3],
          kind: f[2] <= 3 ? '市町村役場等' : '公的集会施設',
          mask: f[6],
        },
        geometry: { type: 'Point', coordinates: [f[4], f[5]] },
      })),
    }),
    [detail]
  );
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
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
        <Button
          size="sm"
          variant="outline"
          aria-pressed={source}
          onClick={() => setSource((v) => !v)}
        >
          区域面の境界{source ? 'を隠す' : 'を表示'}
        </Button>
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
        className="isolate h-[480px] rounded-none lg:h-[620px]"
        aria-label={`${detail.areaName}の指定区域面と人口・公共施設`}
      >
        <TileLayer
          url={GEO_BASEMAP.url}
          attribution={GEO_BASEMAP.attribution}
        />
        <GeoJSON
          key={`${detail.areaCode}-${view}`}
          data={model.collection}
          style={(f) => ({
            color: '#ffffff',
            weight: 0.2,
            fillOpacity: 0.6,
            fillColor:
              view === 'population'
                ? Number(f?.properties?.population2020) >= 1000
                  ? '#1e3a8a'
                  : Number(f?.properties?.population2020) >= 100
                    ? '#2563eb'
                    : '#93c5fd'
                : ['#cbd5e1', '#2563eb', '#7e22ce'][
                    Number(f?.properties?.centerClass)
                  ],
          })}
          onEachFeature={(f, l) => {
            const p = f.properties,
              n = document.createElement('span');
            n.textContent = `メッシュ ${p.meshCode}｜2020年基準人口 ${Number(p.population2020).toLocaleString('ja-JP', { maximumFractionDigits: 4 })}人｜${LANDSLIDE_CLASS_LABELS[Number(p.centerClass)]}${p.boundaryCell ? '｜境界と交差する格子' : ''}`;
            l.bindTooltip(n, { sticky: true });
            l.bindPopup(n.cloneNode(true) as HTMLElement);
          }}
        />
        {view === 'facilities' ? (
          <GeoJSON
            key={`facilities-${detail.areaCode}`}
            data={facilities}
            pointToLayer={(f, ll) =>
              circleMarker(ll, {
                renderer,
                radius: 4,
                color: Number(f.properties?.mask) ? '#7e22ce' : '#334155',
                fillOpacity: 0.8,
              })
            }
            onEachFeature={(f, l) => {
              const n = document.createElement('span');
              n.textContent = `${f.properties?.name}｜${f.properties?.kind}｜${Number(f.properties?.mask) ? '原典地点が指定区域面内' : '原典地点が入力面外（安全を示さない）'}`;
              l.bindTooltip(n);
            }}
          />
        ) : null}
        {source ? <Source manifest={manifest} /> : null}
        <Fit center={model.center} bounds={model.bounds} extent={extent} />
      </MapContainer>
    </div>
  );
}

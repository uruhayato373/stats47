'use client';

import 'leaflet/dist/leaflet.css';
import { useMemo } from 'react';

import L, { type LatLngBoundsExpression } from 'leaflet';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';

import { GEO_BASEMAP } from '../lib/geo-basemap';
import { populationLayerColor, type GeoLayerData } from '../lib/geo-layer-data';

import type { Feature, FeatureCollection, Point, Polygon } from 'geojson';

export function GeoLayerMap({
  data,
  year,
  fullExtent,
}: {
  data: GeoLayerData;
  year: '2020' | '2050';
  fullExtent: boolean;
}) {
  const collection = useMemo<FeatureCollection<Point | Polygon>>(() => {
    const features: Feature<Point | Polygon>[] =
      data.kind === 'population'
        ? data.meshes.map(([id, w, s, e, n, p0, p1]) => ({
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [w / 1e6, s / 1e6],
                  [e / 1e6, s / 1e6],
                  [e / 1e6, n / 1e6],
                  [w / 1e6, n / 1e6],
                  [w / 1e6, s / 1e6],
                ],
              ],
            },
            properties: {
              label: `メッシュ ${id}｜2020年 ${p0.toLocaleString('ja-JP')}人｜2050年 ${p1.toLocaleString('ja-JP')}人`,
              value: year === '2020' ? p0 : p1,
            },
          }))
        : data.kind === 'land-price'
          ? data.points.map(([id, x, y, price, change]) => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [x / 1e6, y / 1e6] },
              properties: {
                label: `住宅地点 ${id}｜2026年 ${price.toLocaleString('ja-JP')}円/㎡｜前年比 ${change === null ? '不明' : `${change}%`}`,
              },
            }))
          : data.stations.map(([, name, x, y]) => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [x / 1e6, y / 1e6] },
              properties: { label: `${name}（駅代表点）` },
            }));
    return { type: 'FeatureCollection', features };
  }, [data, year]);
  const coordinates = collection.features.map((f) =>
    f.geometry.type === 'Point'
      ? f.geometry.coordinates
      : f.geometry.coordinates[0][0]
  );
  // The median avoids centering Tokyo/Kagoshima in the sea because of distant islands.
  const median = (values: number[]) =>
    [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const center: [number, number] = [
    median(coordinates.map((p) => p[1])),
    median(coordinates.map((p) => p[0])),
  ];
  const bounds: LatLngBoundsExpression = L.geoJSON(collection).getBounds();
  return (
    <MapContainer
      key={`${data.areaCode}-${year}-${fullExtent}`}
      center={center}
      zoom={9}
      bounds={fullExtent ? bounds : undefined}
      boundsOptions={{ padding: [20, 20], maxZoom: 11 }}
      zoomAnimation={false}
      scrollWheelZoom={false}
      preferCanvas
      className="h-[360px] w-full sm:h-[480px] lg:h-[560px]"
      aria-label={`${data.areaName}の単体GIS地図`}
    >
      <TileLayer
        url={GEO_BASEMAP.url}
        attribution={GEO_BASEMAP.attribution}
        minZoom={GEO_BASEMAP.minZoom}
        maxZoom={GEO_BASEMAP.maxZoom}
      />
      <GeoJSON
        data={collection}
        style={(feature) =>
          data.kind !== 'population'
            ? {
                color: data.kind === 'stations' ? '#0f172a' : '#ffffff',
                weight: 1.3,
                fillColor: data.kind === 'stations' ? '#f8fafc' : '#7c3aed',
                fillOpacity: 0.9,
              }
            : {
                color: '#ffffff',
                weight: 0.5,
                fillColor: populationLayerColor(
                  Number(feature?.properties?.value ?? 0)
                ),
                fillOpacity: 0.8,
              }
        }
        pointToLayer={(_feature, latlng) =>
          L.circleMarker(latlng, {
            radius: 5,
            color: data.kind === 'stations' ? '#0f172a' : '#ffffff',
            weight: 1.3,
            fillColor: data.kind === 'stations' ? '#f8fafc' : '#7c3aed',
            fillOpacity: 0.9,
          })
        }
        onEachFeature={(feature, layer) => {
          const text = document.createElement('span');
          text.textContent = String(feature.properties?.label ?? '');
          layer.bindPopup(text, {
            maxWidth: 200,
            minWidth: 120,
            autoPanPadding: [8, 8],
            keepInView: true,
          });
        }}
      />
    </MapContainer>
  );
}

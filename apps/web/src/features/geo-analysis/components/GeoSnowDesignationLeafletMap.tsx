'use client';
import { useEffect, useMemo, useState } from 'react';

import { to2DigitPrefCode } from '@stats47/area';
import { Button } from '@stats47/components/atoms/ui/button';
import { GeoJSON } from 'react-leaflet';

import { LeafletMapFrame } from '@/components/charts/LeafletMapFrame';

import { fetchGeoSnowSourceAction } from '../actions';
import {
  buildGeoSnowMapModel,
  SNOW_CLASS_LABELS,
} from '../lib/build-geo-snow-map-model';
import { GEO_MAP_COLORS } from '../lib/geo-map.palette';

import type {
  GeoSnowPrefDetail,
  GeoAnalysisEvidenceManifest,
} from '@stats47/gis';
import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';
export function GeoSnowDesignationLeafletMap({
  detail,
  view,
  manifest,
}: {
  detail: GeoSnowPrefDetail;
  view: 'population' | 'overlap';
  manifest: GeoAnalysisEvidenceManifest;
}) {
  const model = useMemo(() => buildGeoSnowMapModel(detail), [detail]);
  const focus = useMemo(
    () => ({ center: model.center, zoom: 10, label: '人口最多メッシュ周辺' }),
    [model]
  );
  const [showSource, setShowSource] = useState(true);
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
        ? fetchGeoSnowSourceAction(to2DigitPrefCode(detail.areaCode), {
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
    <LeafletMapFrame
      ariaLabel={`${detail.areaName}の豪雪指定区域と250m人口メッシュ`}
      bounds={model.bounds}
      focus={focus}
      toolbar={
        view === 'overlap' ? (
          <>
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
            {showSource && sourceState !== 'ready' ? (
              <p role="status" className="basis-full text-xs text-muted-foreground">
                {sourceState === 'loading'
                  ? '指定境界を読み込んでいます…'
                  : '指定境界を取得できません。人口メッシュの判定結果は表示しています。'}
              </p>
            ) : null}
          </>
        ) : null
      }
    >
      <GeoJSON
        key={`${detail.areaCode}-${view}`}
        data={model.collection}
        style={(f) => ({
          color: f?.properties?.boundaryCell ? GEO_MAP_COLORS.designationBoundaryCell : GEO_MAP_COLORS.outline,
          weight: f?.properties?.boundaryCell ? 0.6 : 0.2,
          fillOpacity: 0.65,
          fillColor:
            view === 'overlap'
              ? (GEO_MAP_COLORS.designationClass[
                  Number(f?.properties?.centerClass)
                ] ?? GEO_MAP_COLORS.designationClass[0])
              : Number(f?.properties?.population2020) >= 1000
                ? GEO_MAP_COLORS.designationPopulation.high
                : Number(f?.properties?.population2020) >= 100
                  ? GEO_MAP_COLORS.designationPopulation.medium
                  : GEO_MAP_COLORS.designationPopulation.low,
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
            color: Number(f?.properties?.class) === 2 ? GEO_MAP_COLORS.designationSourceOutline.special : GEO_MAP_COLORS.designationSourceOutline.standard,
            weight: 1.5,
            fill: false,
            interactive: false,
          })}
        />
      ) : null}
    </LeafletMapFrame>
  );
}

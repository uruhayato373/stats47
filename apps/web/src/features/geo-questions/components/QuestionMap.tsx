'use client';

import { useEffect, useMemo, useState } from 'react';

import { ChartPanel } from '@stats47/components';
import { Button } from '@stats47/components/atoms/ui/button';
import { INFRA_SCOPE_REGIONS } from '@stats47/gis/infra-history';
import { geoCentroid, geoDistance, geoMercator, geoPath } from 'd3-geo';
import { Map as MapIcon } from 'lucide-react';
import { feature as topoFeature } from 'topojson-client';

import { ChartLegend } from '@/components/charts/ChartLegend';

import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';

interface QuestionMapProps {
  readonly title: string;
  readonly unitOfArea: 'municipality' | 'prefecture';
  readonly groups: readonly { code: string; label: string; color: string; count: number }[];
  readonly areas: Readonly<Record<string, string>>;
  readonly names: Readonly<Record<string, string>>;
  readonly points: readonly { name: string; lon: number; lat: number; year: number }[];
}

const MAP_WIDTH = 640;
const MAP_HEIGHT = 600;
const MAP_PADDING = 12;
const CODE_PROPERTY = 'N03_007';
/** 縮尺を決めるときに外す離島の目安 (範囲の中心からの距離)。小笠原諸島などで本土が小さくならないように */
const FIT_MAX_DISTANCE_KM = 450;
const EARTH_RADIUS_KM = 6371;
/** 市区町村の地図の既定の範囲 */
const DEFAULT_REGION = 'kanto';

type Shape = { readonly d: string; readonly code: string };

function fetchTopology(url: string): Promise<Topology> {
  return fetch(url).then((res) => (res.ok ? (res.json() as Promise<Topology>) : Promise.reject(res.status)));
}

function featuresOf(topology: Topology): Feature<Geometry, Record<string, string>>[] {
  const object = topology.objects[Object.keys(topology.objects)[0]] as GeometryCollection;
  return (topoFeature(topology, object) as FeatureCollection<Geometry, Record<string, string>>).features;
}

/** 範囲の中心から遠い形 (離島) を外して縮尺を決める */
function fitTargets<T extends Feature<Geometry>>(features: readonly T[]): T[] {
  if (features.length < 3) return [...features];
  const centers = features.map((f) => geoCentroid(f));
  const median = (values: number[]) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const center: [number, number] = [median(centers.map((c) => c[0])), median(centers.map((c) => c[1]))];
  const near = features.filter((_, i) => geoDistance(center, centers[i]) * EARTH_RADIUS_KM <= FIT_MAX_DISTANCE_KM);
  return near.length > 0 ? near : [...features];
}

/**
 * 問いの組で塗り分けた地図。地図は「どこの話か」を示す補助で、答えの主役は推移のグラフ。
 * 市区町村の問いは地方を選んで描く (全国 1,700 余りの形を一度に読まない)
 */
export function QuestionMap({ title, unitOfArea, groups, areas, names, points }: QuestionMapProps) {
  const [regionCode, setRegionCode] = useState(DEFAULT_REGION);
  const region = INFRA_SCOPE_REGIONS.find((item) => item.code === regionCode) ?? INFRA_SCOPE_REGIONS[0];
  const requestKey = unitOfArea === 'prefecture' ? 'prefecture' : region.prefCodes.join(',');
  const [loaded, setLoaded] = useState<{ key: string; shapes: Shape[]; borders: Shape[]; project: ((lon: number, lat: number) => [number, number] | null) | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const prefCodes = requestKey === 'prefecture' ? [] : requestKey.split(',');
    Promise.all([fetchTopology('/api/mf-topo/prefecture'), Promise.all(prefCodes.map((code) => fetchTopology(`/api/mf-topo/${code}`)))])
      .then(([prefTopo, muniTopos]) => {
        if (cancelled) return;
        const prefFeatures = featuresOf(prefTopo);
        const scopePrefs = prefCodes.length === 0 ? prefFeatures : prefFeatures.filter((f) => prefCodes.includes(String(f.properties[CODE_PROPERTY])));
        const areaFeatures = prefCodes.length === 0 ? prefFeatures : muniTopos.flatMap(featuresOf);
        const projection = geoMercator().fitExtent(
          [
            [MAP_PADDING, MAP_PADDING],
            [MAP_WIDTH - MAP_PADDING, MAP_HEIGHT - MAP_PADDING],
          ],
          // 全国の県の地図は全県で縮尺を決める (離島を外す条件は地方の市区町村の地図だけ)
          { type: 'FeatureCollection', features: prefCodes.length === 0 ? areaFeatures : fitTargets(areaFeatures) } as FeatureCollection,
        );
        const path = geoPath(projection);
        const toShape = (f: Feature<Geometry, Record<string, string>>) => {
          const code = String(f.properties[CODE_PROPERTY]);
          // 県の地図の行政コードは 2 桁 (県コード) に揃える
          return { d: path(f) ?? '', code: prefCodes.length === 0 ? code.slice(0, 2) : code };
        };
        setLoaded({
          key: requestKey,
          shapes: areaFeatures.map(toShape).filter((s) => s.d !== ''),
          borders: scopePrefs.map(toShape).filter((s) => s.d !== ''),
          project: (lon, lat) => {
            const xy = projection([lon, lat]);
            return xy ? [xy[0], xy[1]] : null;
          },
        });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key: requestKey, shapes: [], borders: [], project: null });
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const current = loaded?.key === requestKey ? loaded : null;
  const colorOf = useMemo(() => new Map(groups.map((group) => [group.code, group.color])), [groups]);
  const labelOf = useMemo(() => new Map(groups.map((group) => [group.code, group.label])), [groups]);

  return (
    <ChartPanel
      title={unitOfArea === 'prefecture' ? title : `${title} (${region.name})`}
      icon={<MapIcon />}
      footer="地図は「どこの話か」を示す補助です。比べた結果は上のグラフを見てください。"
    >
      <div className="space-y-3">
        {unitOfArea === 'municipality' && (
          <div className="flex flex-wrap gap-1" role="group" aria-label="地図の範囲">
            {INFRA_SCOPE_REGIONS.map((item) => (
              <Button
                key={item.code}
                type="button"
                size="sm"
                variant={item.code === regionCode ? 'outline' : 'ghost'}
                aria-pressed={item.code === regionCode}
                onClick={() => setRegionCode(item.code)}
              >
                {item.name}
              </Button>
            ))}
          </div>
        )}
        <div className="relative">
          <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="h-auto w-full" role="img" aria-label={title}>
            {current?.shapes.map((shape) => {
              const group = areas[shape.code];
              return (
                <path
                  key={`${shape.code}-${shape.d.length}`}
                  d={shape.d}
                  fill={group ? (colorOf.get(group) ?? 'var(--color-muted)') : 'var(--color-muted)'}
                  fillOpacity={group ? 0.85 : 0.4}
                  stroke="var(--color-background)"
                  strokeWidth={0.5}
                >
                  <title>{`${names[shape.code] ?? shape.code}: ${group ? (labelOf.get(group) ?? group) : '集計外'}`}</title>
                </path>
              );
            })}
            {unitOfArea === 'municipality' &&
              current?.borders.map((shape) => (
                <path key={`border-${shape.code}-${shape.d.length}`} d={shape.d} fill="none" stroke="var(--color-foreground)" strokeWidth={0.8} opacity={0.5} />
              ))}
            {current?.project &&
              points.map((point) => {
                const xy = current.project?.(point.lon, point.lat);
                if (!xy || xy[0] < 0 || xy[0] > MAP_WIDTH || xy[1] < 0 || xy[1] > MAP_HEIGHT) return null;
                return (
                  <circle key={`${point.name}-${point.year}`} cx={xy[0]} cy={xy[1]} r={3} fill="var(--color-foreground)" stroke="var(--color-background)" strokeWidth={1}>
                    <title>{`${point.name} (${point.year}年開業)`}</title>
                  </circle>
                );
              })}
          </svg>
          {!current && <p className="absolute inset-0 grid place-items-center text-muted-foreground">地図データを読み込んでいます…</p>}
        </div>
        <ChartLegend
          layout="list"
          items={groups.map((group) => ({ key: group.code, label: group.label, color: group.color, value: `${group.count}` }))}
        />
      </div>
    </ChartPanel>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';

import { ChartPanel } from '@stats47/components';
import { INFRA_SCOPE_REGIONS } from '@stats47/gis/infra-history';
import { geoPath } from 'd3-geo';
import { Map as MapIcon } from 'lucide-react';

import { ChartLegend } from '@/components/charts/ChartLegend';
import { fetchTopology, fitGeoSvgMercator, GEO_SVG_MAP, topologyFeatures, withoutFarIslands } from '@/components/charts/geo-topology';
import { SingleSelectToggleGroup } from '@/components/molecules/SingleSelectToggleGroup';

import type { Feature, Geometry } from 'geojson';

interface QuestionMapProps {
  readonly title: string;
  readonly unitOfArea: 'municipality' | 'prefecture';
  readonly groups: readonly { code: string; label: string; color: string; count: number }[];
  readonly areas: Readonly<Record<string, string>>;
  readonly names: Readonly<Record<string, string>>;
  readonly points: readonly { name: string; lon: number; lat: number; year: number }[];
}

const CODE_PROPERTY = 'N03_007';
/** 市区町村の地図の既定の範囲 */
const DEFAULT_REGION = 'kanto';

type Shape = { readonly d: string; readonly code: string };

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
        const prefFeatures = topologyFeatures<Record<string, string>>(prefTopo);
        const scopePrefs = prefCodes.length === 0 ? prefFeatures : prefFeatures.filter((f) => prefCodes.includes(String(f.properties[CODE_PROPERTY])));
        const areaFeatures = prefCodes.length === 0 ? prefFeatures : muniTopos.flatMap((topology) => topologyFeatures<Record<string, string>>(topology));
        const projection = fitGeoSvgMercator(
          // 全国の県の地図は全県で縮尺を決める (離島を外す条件は地方の市区町村の地図だけ)
          prefCodes.length === 0 ? areaFeatures : withoutFarIslands(areaFeatures),
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
          <SingleSelectToggleGroup
            aria-label="地図の範囲"
            value={regionCode}
            onValueChange={setRegionCode}
            options={INFRA_SCOPE_REGIONS.map(item => ({ value: item.code, label: item.name }))}
          />
        )}
        <div className="relative">
          <svg viewBox={`0 0 ${GEO_SVG_MAP.width} ${GEO_SVG_MAP.height}`} className="h-auto w-full" role="img" aria-label={title}>
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
                if (!xy || xy[0] < 0 || xy[0] > GEO_SVG_MAP.width || xy[1] < 0 || xy[1] > GEO_SVG_MAP.height) return null;
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

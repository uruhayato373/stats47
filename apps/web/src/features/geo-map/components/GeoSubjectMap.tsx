'use client';

import { useEffect, useMemo, useState } from 'react';

import { PanelGrid, SectionCard } from '@stats47/components';
import { Button } from '@stats47/components/atoms/ui/button';
import { Slider } from '@stats47/components/atoms/ui/slider';
import { geoContains, geoMercator, geoPath } from 'd3-geo';
import { scaleLinear, scaleLog } from 'd3-scale';
import { Pause, Play } from 'lucide-react';
import { feature as topoFeature } from 'topojson-client';

import { ChartLegend } from '@/components/charts/ChartLegend';
import { STAT_VALUE_CLASS } from '@/components/surface';

import type { GeoMapLayer } from '../lib/load-geo-map';
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';

type FeatureLayer = Extract<GeoMapLayer, { kind: 'features' }>;
type MunicipalLayer = Extract<GeoMapLayer, { kind: 'municipal' }>;

interface GeoSubjectMapProps {
  readonly scopeName: string;
  readonly prefCodes: readonly string[];
  readonly isNational: boolean;
  /** 重ねる順 (下から) に並んだ主題 */
  readonly layers: readonly GeoMapLayer[];
  readonly firstYear: number;
  readonly lastYear: number;
  /** スライダーの期間を背景に合わせて絞ったときの説明 */
  readonly rangeNote: string | null;
}

const MAP_WIDTH = 640;
const MAP_HEIGHT = 640;
const MAP_PADDING = 16;
/** 再生時の 1 年あたりの間隔 (ms) */
const PLAY_INTERVAL_MS = 280;
/** 県・市区町村の境界の行政コード */
const CODE_PROPERTY = 'N03_007';
/** 塗り分けの色。区分の色 (chart-1〜4・muted) と重ならないトークン */
const AREA_COLOR = 'hsl(var(--chart-5))';
const AREA_OPACITY = { min: 0.12, max: 0.9 } as const;
/** 正負の色分け (増加・減少) */
const POSITIVE_COLOR = 'hsl(var(--positive))';
const NEGATIVE_COLOR = 'hsl(var(--negative))';
const POINT_RADIUS = 2.6;

/** 区間・点の主題の地物 (s 開始年・e 終了年・c 区分・n 名前) */
interface ShapeProps {
  readonly s: number;
  readonly e: number;
  readonly c: string;
  readonly n?: string;
}

interface DrawnShape {
  readonly d: string;
  readonly xy: readonly [number, number] | null;
  readonly props: ShapeProps;
}

interface LoadedMap {
  readonly boundaries: readonly { d: string; code: string }[];
  readonly municipalities: readonly { d: string; code: string }[];
  readonly shapes: Readonly<Record<string, readonly DrawnShape[]>>;
}

function fetchTopology(url: string): Promise<Topology> {
  return fetch(url).then((res) => (res.ok ? (res.json() as Promise<Topology>) : Promise.reject(res.status)));
}

function featuresOf<P>(topology: Topology, names: readonly string[]): Feature<Geometry, P>[] {
  const name = names.find((item) => topology.objects[item]) ?? Object.keys(topology.objects)[0];
  return (topoFeature(topology, topology.objects[name] as GeometryCollection) as FeatureCollection<Geometry, P>).features;
}

function useGeoMap(
  prefCodes: readonly string[],
  isNational: boolean,
  featureLayers: readonly FeatureLayer[],
  needsMunicipalities: boolean,
): { map: LoadedMap | null; failed: boolean } {
  const requestKey = [prefCodes.join(','), isNational, needsMunicipalities, ...featureLayers.map((layer) => layer.url)].join('|');
  const [loaded, setLoaded] = useState<{ key: string; map: LoadedMap | null; failed: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const prefKey = requestKey.split('|')[0];
    const wanted = new Set(prefKey.split(','));
    Promise.all([
      fetchTopology('/api/mf-topo/prefecture'),
      // 市区町村の境界は塗り分けを描くときだけ (政令指定都市は市全体)
      needsMunicipalities ? Promise.all([...wanted].map((code) => fetchTopology(`/api/mf-topo/${code}`))) : Promise.resolve([]),
      Promise.all(featureLayers.map((layer) => fetchTopology(layer.url))),
    ])
      .then(([prefTopo, muniTopos, layerTopos]) => {
        if (cancelled) return;
        const allBoundaries = featuresOf<Record<string, string>>(prefTopo, []);
        const scopeBoundaries = isNational
          ? allBoundaries
          : allBoundaries.filter((f) => wanted.has(String(f.properties[CODE_PROPERTY])));
        const layerFeatures = featureLayers.map((layer, i) => featuresOf<ShapeProps>(layerTopos[i], ['lines', 'points']));
        // 線の主題があれば、全年の線の広がりで縮尺を決める (県境で決めると東京都の小笠原諸島などで本土が小さくなる)。
        // 線が無ければ範囲の県境で決める (点の主題は全国 1 ファイルのものがあり、広がりの手がかりにならない)
        const lineFeatures = featureLayers.flatMap((layer, i) => (layer.geometry === 'line' ? layerFeatures[i] : []));
        const projection = geoMercator().fitExtent(
          [
            [MAP_PADDING, MAP_PADDING],
            [MAP_WIDTH - MAP_PADDING, MAP_HEIGHT - MAP_PADDING],
          ],
          { type: 'FeatureCollection', features: lineFeatures.length > 0 ? lineFeatures : scopeBoundaries } as FeatureCollection,
        );
        const path = geoPath(projection);
        const draw = <P extends GeoJsonProperties>(f: Feature<Geometry, P>) => {
          if (f.geometry?.type === 'Point') {
            const xy = projection(f.geometry.coordinates as [number, number]);
            return { d: '', xy: xy ? ([xy[0], xy[1]] as const) : null };
          }
          return { d: path(f) ?? '', xy: null };
        };
        // 全国 1 ファイルの点 (接合部など) は、範囲の県の中にあるものだけを描く
        const inScope = (f: Feature<Geometry, ShapeProps>) => {
          const { geometry } = f;
          if (isNational || geometry?.type !== 'Point') return true;
          return scopeBoundaries.some((boundary) => geoContains(boundary, geometry.coordinates as [number, number]));
        };
        const shapes: Record<string, DrawnShape[]> = {};
        featureLayers.forEach((layer, i) => {
          shapes[layer.id] = layerFeatures[i]
            .filter(inScope)
            .map((f) => ({ ...draw(f), props: f.properties }))
            .filter((shape) => shape.d !== '' || shape.xy !== null);
        });
        setLoaded({
          key: requestKey,
          failed: false,
          map: {
            boundaries: scopeBoundaries
              .map((f) => ({ d: path(f) ?? '', code: String(f.properties[CODE_PROPERTY]) }))
              .filter((b) => b.d !== ''),
            municipalities: muniTopos
              .flatMap((topology) => featuresOf<Record<string, string>>(topology, []))
              .map((f) => ({ d: path(f) ?? '', code: String(f.properties[CODE_PROPERTY]) }))
              .filter((m) => m.d !== ''),
            shapes,
          },
        });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key: requestKey, map: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey, isNational, needsMunicipalities, featureLayers]);

  const current = loaded?.key === requestKey ? loaded : null;
  return { map: current?.map ?? null, failed: current?.failed ?? false };
}

/** スライダーの年に合わせた市区町村の値。latest-before はその年以前で最も近い年の値 */
function municipalValueAt(layer: MunicipalLayer, code: string, year: number): { value: number; year: number } | null {
  const series = layer.values[code];
  if (!series) return null;
  for (let i = layer.years.length - 1; i >= 0; i--) {
    const value = series[i];
    if (layer.years[i] > year || value === null) continue;
    if (layer.match === 'exact' && layer.years[i] !== year) return null;
    return { value, year: layer.years[i] };
  }
  return null;
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('ja-JP');
}

/** 塗り分けの値の表示。増減率 (正負の色分け) は符号を付ける */
function formatMunicipalValue(layer: MunicipalLayer, value: number): string {
  const sign = layer.domain.kind === 'diverging' && value > 0 ? '+' : '';
  return `${sign}${formatNumber(value)} ${layer.measure.unit}`;
}

export function GeoSubjectMap({ scopeName, prefCodes, isNational, layers, firstYear, lastYear, rangeNote }: GeoSubjectMapProps) {
  const [year, setYear] = useState(lastYear);
  const [isPlaying, setIsPlaying] = useState(false);
  const featureLayers = useMemo(() => layers.filter((layer): layer is FeatureLayer => layer.kind === 'features'), [layers]);
  const municipal = useMemo(() => layers.find((layer): layer is MunicipalLayer => layer.kind === 'municipal') ?? null, [layers]);
  const { map, failed } = useGeoMap(prefCodes, isNational, featureLayers, municipal !== null);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setYear((current) => {
        if (current >= lastYear) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, PLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isPlaying, lastYear]);

  // 塗り分けの色。基準は全国の全年で固定 (サーバーが決める)。範囲や年を変えても、同じ色は同じ値を表す
  const fillOf = useMemo(() => {
    if (!municipal) return null;
    const { domain } = municipal;
    if (domain.kind === 'diverging') {
      const opacity = scaleLinear().domain([0, domain.maxAbs]).range([AREA_OPACITY.min, AREA_OPACITY.max]).clamp(true);
      return (value: number) => ({ color: value >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR, opacity: opacity(Math.abs(value)) });
    }
    const opacity =
      domain.scale === 'log' && domain.min > 0
        ? scaleLog().domain([domain.min, domain.max]).range([AREA_OPACITY.min, AREA_OPACITY.max]).clamp(true)
        : scaleLinear().domain([domain.min, domain.max]).range([AREA_OPACITY.min, AREA_OPACITY.max]).clamp(true);
    return (value: number) => ({ color: AREA_COLOR, opacity: opacity(Math.max(value, domain.min)) });
  }, [municipal]);

  const colorOf = useMemo(() => {
    const colors = new Map<string, string>();
    for (const layer of featureLayers) for (const item of layer.classes) colors.set(`${layer.id}:${item.code}`, item.color);
    return colors;
  }, [featureLayers]);

  const municipalYear = useMemo(() => {
    if (!municipal) return null;
    const years = municipal.years.filter((y) => y <= year);
    return years.length > 0 ? years[years.length - 1] : null;
  }, [municipal, year]);

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (year >= lastYear) setYear(firstYear);
    setIsPlaying(true);
  };

  const title = `${year}年の${scopeName}`;

  return (
    <PanelGrid className="@lg:grid-cols-3">
      <SectionCard aria-label={title} className="@lg:col-span-2" bodyClassName="space-y-3">
        <div className="relative">
          <p className={`pointer-events-none absolute top-0 left-0 tabular-nums ${STAT_VALUE_CLASS}`} aria-hidden>
            {year}年
          </p>
          <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="h-auto w-full" role="img" aria-label={title}>
            {map?.boundaries.map((boundary) => (
              <path key={`pref-${boundary.code}-${boundary.d.length}`} d={boundary.d} fill="var(--color-muted)" stroke="none" />
            ))}
            {municipal &&
              map?.municipalities.map((shape) => {
                const found = municipalValueAt(municipal, shape.code, year);
                const fill = found && fillOf ? fillOf(found.value) : null;
                return (
                  <path
                    key={`muni-${shape.code}-${shape.d.length}`}
                    d={shape.d}
                    fill={fill?.color ?? AREA_COLOR}
                    fillOpacity={fill?.opacity ?? 0}
                    stroke="var(--color-background)"
                    strokeWidth={0.5}
                  >
                    <title>
                      {`${municipal.names[shape.code] ?? shape.code}: ${found ? `${formatMunicipalValue(municipal, found.value)} (${found.year}年)` : 'この年の値なし'}`}
                    </title>
                  </path>
                );
              })}
            {map?.boundaries.map((boundary) => (
              <path
                key={`pref-line-${boundary.code}-${boundary.d.length}`}
                d={boundary.d}
                fill="none"
                stroke="var(--color-muted-foreground)"
                strokeWidth={0.7}
                opacity={0.6}
              />
            ))}
            {featureLayers.map((layer) =>
              (map?.shapes[layer.id] ?? [])
                .filter((shape) => shape.props.s <= year && year <= shape.props.e)
                .map((shape, i) => {
                  const color = colorOf.get(`${layer.id}:${shape.props.c}`) ?? 'var(--color-foreground)';
                  return shape.xy ? (
                    <circle
                      key={`${layer.id}-${i}`}
                      cx={shape.xy[0]}
                      cy={shape.xy[1]}
                      r={POINT_RADIUS}
                      fill={color}
                      stroke="var(--color-background)"
                      strokeWidth={0.6}
                    >
                      {shape.props.n && <title>{shape.props.n}</title>}
                    </circle>
                  ) : (
                    <path key={`${layer.id}-${i}`} d={shape.d} fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
                  );
                }),
            )}
          </svg>
          {!map && (
            <p className="absolute inset-0 grid place-items-center text-muted-foreground">
              {failed ? '地図データを読み込めませんでした。' : '地図データを読み込んでいます…'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handlePlay}
            aria-label={isPlaying ? '再生を止める' : `${firstYear}年から再生する`}
          >
            {isPlaying ? <Pause /> : <Play />}
          </Button>
          <Slider
            min={firstYear}
            max={lastYear}
            step={1}
            value={year}
            onValueChange={(value) => {
              setIsPlaying(false);
              setYear(Array.isArray(value) ? value[0] : value);
            }}
            aria-label="表示する年"
            className="flex-1"
          />
        </div>
        {rangeNote && <p className="text-xs text-muted-foreground">{rangeNote}</p>}
      </SectionCard>

      <SectionCard aria-label="凡例" bodyClassName="space-y-4">
        {municipal && (
          <div className="space-y-1.5">
            <p className="font-medium">{municipal.label}</p>
            <p className="text-xs text-muted-foreground">
              {municipalYear === null
                ? `${municipal.years[0]}年より前は値がありません`
                : `${municipalYear}年の値${municipalYear !== year ? ` (${year}年以前で最も近い年)` : ''}`}
            </p>
            <div className="space-y-1">
              <div
                className="h-2 w-full"
                style={{
                  background:
                    municipal.domain.kind === 'diverging'
                      ? `linear-gradient(to right, ${NEGATIVE_COLOR}, transparent, ${POSITIVE_COLOR})`
                      : `linear-gradient(to right, color-mix(in srgb, ${AREA_COLOR} ${AREA_OPACITY.min * 100}%, transparent), ${AREA_COLOR})`,
                }}
                aria-hidden
              />
              {municipal.domain.kind === 'diverging' ? (
                <p className="flex justify-between text-xs tabular-nums text-muted-foreground">
                  <span>−{formatNumber(municipal.domain.maxAbs)}{municipal.measure.unit} 以下</span>
                  <span>0</span>
                  <span>+{formatNumber(municipal.domain.maxAbs)}{municipal.measure.unit} 以上</span>
                </p>
              ) : (
                <p className="flex justify-between text-xs tabular-nums text-muted-foreground">
                  <span>
                    {formatNumber(municipal.domain.min)} {municipal.measure.unit}
                  </span>
                  <span>
                    {formatNumber(municipal.domain.max)} {municipal.measure.unit}
                  </span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">色の基準は全国の全年で固定しています。</p>
            </div>
          </div>
        )}
        {featureLayers.map((layer) => (
          <div key={layer.id} className="space-y-1.5">
            <p className="font-medium">{layer.label}</p>
            {(year < layer.firstYear || year > layer.lastYear) && (
              <p className="text-xs text-muted-foreground">
                {layer.firstYear}〜{layer.lastYear}年のデータです
              </p>
            )}
            <ChartLegend
              layout="list"
              label={`${layer.label}の区分`}
              items={layer.classes.map((item) => ({
                key: item.code,
                label: item.label,
                color: item.color,
                marker: layer.geometry === 'line' ? 'line' : 'square',
              }))}
            />
          </div>
        ))}
      </SectionCard>
    </PanelGrid>
  );
}

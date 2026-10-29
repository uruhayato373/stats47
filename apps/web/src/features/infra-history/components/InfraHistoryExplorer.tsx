'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { PanelGrid, SectionCard } from '@stats47/components';
import { Button } from '@stats47/components/atoms/ui/button';
import { Slider } from '@stats47/components/atoms/ui/slider';
import { geoMercator, geoPath } from 'd3-geo';
import { ListOrdered, Pause, Play } from 'lucide-react';
import { feature as topoFeature } from 'topojson-client';

import Link from '@/components/atoms/SiteLink';
import { ChartLegend } from '@/components/charts/ChartLegend';
import { NumericTrendChart } from '@/components/charts/NumericTrendChart';
import { STAT_VALUE_CLASS, StatTile } from '@/components/surface';

import type {
  InfraCategory,
  InfraEventProperties,
  InfraGeometry,
  InfraMeasure,
  InfraLengthSeries,
  InfraPieceProperties,
} from '@stats47/gis/infra-history';
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';

/** 表の 1 行 (地方・県)。total と byCategory は years と同じ並び */
export interface InfraHistoryRow {
  readonly code: string;
  readonly name: string;
  readonly href: string;
  readonly total: readonly number[];
  readonly byCategory: Readonly<Record<string, readonly number[]>>;
}

interface InfraHistoryExplorerProps {
  readonly networkLabel: string;
  readonly scopeName: string;
  readonly years: readonly number[];
  readonly categories: readonly InfraCategory[];
  readonly series: InfraLengthSeries;
  readonly rows: readonly InfraHistoryRow[];
  readonly rowsLabel: string;
  /** 地図の線 (同一オリジンの API) */
  readonly topologyUrl: string;
  /** 県境 (同一オリジンの API) */
  readonly boundaryUrl: string;
  /** 市区町村境界 (県の範囲だけ。同一オリジンの API) */
  readonly municipalityUrl: string | null;
  readonly prefCodes: readonly string[];
  /** 線 (高速道路・鉄道) か点 (空港) か */
  readonly geometry: InfraGeometry;
  /** 集計値の名前と単位 (延長 km / 空港数 か所) */
  readonly measure: InfraMeasure;
  /** 凡例の下に置く出典の 1 行と詳細パネルの入口 (サーバーで組み立てる) */
  readonly footer?: ReactNode;
}

const MAP_WIDTH = 640;
const MAP_HEIGHT = 640;
const MAP_PADDING = 16;
/** 再生時の 1 年あたりの間隔 (ms) */
const PLAY_INTERVAL_MS = 280;
const PREF_CODE_PROPERTY = 'N03_007';

type LineFeature = Feature<Geometry, InfraPieceProperties>;
type EventFeature = Feature<Geometry, InfraEventProperties>;
type BoundaryFeature = Feature<Geometry, Record<string, string>>;

/** 描く図形。線は SVG の path (d)、点は投影後の座標 (xy) */
interface DrawnShape<P> {
  readonly d: string;
  readonly xy: readonly [number, number] | null;
  readonly props: P;
}

interface LoadedMap {
  readonly lines: readonly DrawnShape<InfraPieceProperties>[];
  /** 開通・延伸・廃止・短縮の強調 (属性だけの変更は含まない) */
  readonly events: readonly DrawnShape<InfraEventProperties>[];
  readonly boundaries: readonly { readonly d: string; readonly code: string }[];
  /** 市区町村境界 (県の範囲だけ) */
  readonly municipalities: readonly string[];
}

function fetchTopology(url: string): Promise<Topology> {
  return fetch(url).then((res) => (res.ok ? (res.json() as Promise<Topology>) : Promise.reject(res.status)));
}

function firstObjectFeatures<P>(topology: Topology): Feature<Geometry, P>[] {
  const object = topology.objects[Object.keys(topology.objects)[0]];
  return (topoFeature(topology, object as GeometryCollection) as FeatureCollection<Geometry, P>).features;
}

function useInfraMap(
  topologyUrl: string,
  boundaryUrl: string,
  municipalityUrl: string | null,
  prefCodes: readonly string[],
  isNational: boolean,
  geometry: InfraGeometry,
): { map: LoadedMap | null; failed: boolean } {
  const prefKey = prefCodes.join(',');
  // 読み込み結果は要求ごとの key と一緒に持ち、別の範囲の古い結果を表示しない (effect 内で同期的に消さない)
  const requestKey = `${topologyUrl}|${boundaryUrl}|${municipalityUrl}|${prefKey}|${isNational}|${geometry}`;
  const [loaded, setLoaded] = useState<{ key: string; map: LoadedMap | null; failed: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchTopology(topologyUrl),
      fetchTopology(boundaryUrl),
      // 市区町村境界は補助。取れなくても路線網は描く
      municipalityUrl ? fetchTopology(municipalityUrl).catch(() => null) : Promise.resolve(null),
    ])
      .then(([lineTopo, boundaryTopo, municipalityTopo]) => {
        if (cancelled) return;
        const lineCollection = topoFeature(
          lineTopo,
          lineTopo.objects.lines as GeometryCollection<InfraPieceProperties>,
        ) as FeatureCollection<Geometry, InfraPieceProperties>;
        const eventFeatures = lineTopo.objects.events
          ? (
              topoFeature(
                lineTopo,
                lineTopo.objects.events as GeometryCollection<InfraEventProperties>,
              ) as FeatureCollection<Geometry, InfraEventProperties>
            ).features
          : [];
        const allBoundaries = firstObjectFeatures<Record<string, string>>(boundaryTopo);
        const wanted = new Set(prefKey.split(','));
        const scopeBoundaries = allBoundaries.filter((f) => wanted.has(String(f.properties[PREF_CODE_PROPERTY])));
        // 線は全年の路線の広がりで縮尺を決める (県境で決めると東京都の小笠原諸島などで本土が小さくなる)。
        // 点は 1 県に 1 か所だけのこともあり広がりを持たないので、範囲の県境で決める。路線が無い範囲も県境
        const fitByLines = geometry === 'line' && lineCollection.features.length > 0;
        const fitTarget: FeatureCollection = {
          type: 'FeatureCollection',
          features: fitByLines ? lineCollection.features : isNational ? allBoundaries : scopeBoundaries,
        };
        const projection = geoMercator().fitExtent(
          [
            [MAP_PADDING, MAP_PADDING],
            [MAP_WIDTH - MAP_PADDING, MAP_HEIGHT - MAP_PADDING],
          ],
          fitTarget,
        );
        const path = geoPath(projection);
        const draw = <P extends GeoJsonProperties>(f: Feature<Geometry, P>): DrawnShape<P> => {
          if (f.geometry?.type === 'Point') {
            const xy = projection(f.geometry.coordinates as [number, number]);
            return { d: '', xy: xy ? [xy[0], xy[1]] : null, props: f.properties };
          }
          return { d: path(f) ?? '', xy: null, props: f.properties };
        };
        const isDrawable = (shape: DrawnShape<unknown>) => shape.d !== '' || shape.xy !== null;
        const drawBoundaries: BoundaryFeature[] = isNational ? allBoundaries : scopeBoundaries;
        setLoaded({
          key: requestKey,
          failed: false,
          map: {
            lines: lineCollection.features.map((f: LineFeature) => draw(f)).filter(isDrawable),
            events: eventFeatures.map((f: EventFeature) => draw(f)).filter(isDrawable),
            boundaries: drawBoundaries
              .map((f) => ({ d: path(f) ?? '', code: String(f.properties[PREF_CODE_PROPERTY]) }))
              .filter((b) => b.d !== ''),
            municipalities: municipalityTopo
              ? firstObjectFeatures<Record<string, string>>(municipalityTopo)
                  .map((f) => path(f) ?? '')
                  .filter((d) => d !== '')
              : [],
          },
        });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key: requestKey, map: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey, topologyUrl, boundaryUrl, municipalityUrl, prefKey, isNational, geometry]);

  const current = loaded?.key === requestKey ? loaded : null;
  return { map: current?.map ?? null, failed: current?.failed ?? false };
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('ja-JP');
}

function formatValue(value: number, unit: string): string {
  return `${formatNumber(value)} ${unit}`;
}

function formatDiff(value: number, unit: string): string {
  const rounded = Math.round(value);
  if (rounded === 0) return `±0 ${unit}`;
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toLocaleString('ja-JP')} ${unit}`;
}

/** 点の大きさ (SVG の座標系 640 × 640) */
const POINT_RADIUS = { active: 3.2, opened: 6, closed: 4.5 } as const;

export function InfraHistoryExplorer({
  networkLabel,
  scopeName,
  years,
  categories,
  series,
  rows,
  rowsLabel,
  topologyUrl,
  boundaryUrl,
  municipalityUrl,
  prefCodes,
  geometry,
  measure,
  footer,
}: InfraHistoryExplorerProps) {
  const first = years[0];
  const last = years[years.length - 1];
  const [year, setYear] = useState(last);
  const [isPlaying, setIsPlaying] = useState(false);
  const { map, failed } = useInfraMap(topologyUrl, boundaryUrl, municipalityUrl, prefCodes, prefCodes.length === 47, geometry);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setYear((current) => {
        if (current >= last) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, PLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isPlaying, last]);

  const colorOf = useMemo(
    () => new Map(categories.map((category) => [category.code, category.color])),
    [categories],
  );
  // 凡例で表示を切った種別。地図・合計・推移・一覧のすべてを表示中の種別だけで描く
  const [hiddenCodes, setHiddenCodes] = useState<ReadonlySet<string>>(() => new Set());
  const toggleCategory = (code: string) =>
    setHiddenCodes((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  const isFiltered = hiddenCodes.size > 0;
  // 切っていなければ原典の合計をそのまま使い、切ったときだけ表示中の種別を足し合わせる
  const visibleTotalOf = useMemo(
    () =>
      (source: Pick<InfraLengthSeries, 'total' | 'byCategory'>): readonly number[] =>
        hiddenCodes.size === 0
          ? source.total
          : source.total.map((_, i) =>
              categories.reduce(
                (sum, category) => (hiddenCodes.has(category.code) ? sum : sum + (source.byCategory[category.code]?.[i] ?? 0)),
                0,
              ),
            ),
    [categories, hiddenCodes],
  );
  const visibleTotal = useMemo(() => visibleTotalOf(series), [visibleTotalOf, series]);

  const index = year - first;
  const total = visibleTotal[index] ?? 0;
  const previous = index > 0 ? (visibleTotal[index - 1] ?? 0) : 0;

  const visible = useMemo(() => {
    if (!map) return { active: [], opened: [], closed: [] };
    const isShown = (code: string) => !hiddenCodes.has(code);
    const events = map.events.filter((event) => event.props.y === year && isShown(event.props.c));
    return {
      active: map.lines.filter((line) => line.props.s <= year && year <= line.props.e && isShown(line.props.c)),
      // 強調は生成時に判定した開通・延伸 / 廃止・短縮だけ。記録の付け替え (名前の変更など) は含まない
      opened: events.filter((event) => event.props.k === 'open' || event.props.k === 'extend'),
      closed: events.filter((event) => event.props.k === 'close' || event.props.k === 'shorten'),
    };
  }, [map, year, hiddenCodes]);

  const rankedRows = useMemo(
    () =>
      rows
        .map((row) => {
          const values = visibleTotalOf(row);
          return { ...row, value: values[index] ?? 0, previous: index > 0 ? (values[index - 1] ?? 0) : 0 };
        })
        .sort((a, b) => b.value - a.value || a.code.localeCompare(b.code)),
    [rows, index, visibleTotalOf],
  );
  const maxRowValue = Math.max(...rankedRows.map((row) => row.value), 1);

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (year >= last) setYear(first);
    setIsPlaying(true);
  };

  // 線は「高速道路網」、点は「空港」
  const networkNoun = geometry === 'line' ? `${networkLabel}網` : networkLabel;
  const scopeTitle = `${year}年の${scopeName}の${networkNoun}`;
  const legend =
    geometry === 'line'
      ? { opened: 'この年に開通・延伸', closed: 'この年に廃止・短縮' }
      : { opened: 'この年に供用開始', closed: 'この年に供用終了' };

  return (
    <PanelGrid className="@lg:grid-cols-3">
      {/* 地図と内訳は題名の帯を持たない (h1・範囲の切替・年の表示と重なるため)。名前は aria-label で付ける */}
      <SectionCard aria-label={scopeTitle} className="@lg:col-span-2" bodyClassName="space-y-3">
        <div className="relative">
          <p className={`pointer-events-none absolute top-0 left-0 tabular-nums ${STAT_VALUE_CLASS}`} aria-hidden>
            {year}年
          </p>
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            className="h-auto w-full"
            role="img"
            aria-label={scopeTitle}
          >
            {map?.boundaries.map((boundary) => (
              <path
                key={boundary.code + boundary.d.length}
                d={boundary.d}
                fill="var(--color-muted)"
                stroke="var(--color-border)"
                strokeWidth={0.6}
              />
            ))}
            {map?.municipalities.map((d, i) => (
              <path
                key={`municipality-${i}`}
                d={d}
                fill="none"
                stroke="var(--color-muted-foreground)"
                strokeWidth={0.4}
                opacity={0.45}
              />
            ))}
            {visible.closed.map((shape, i) =>
              shape.xy ? (
                <circle
                  key={`closed-${i}`}
                  cx={shape.xy[0]}
                  cy={shape.xy[1]}
                  r={POINT_RADIUS.closed}
                  fill="none"
                  stroke="var(--color-foreground)"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                />
              ) : (
                <path
                  key={`closed-${i}`}
                  d={shape.d}
                  fill="none"
                  stroke="var(--color-foreground)"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  opacity={0.85}
                />
              ),
            )}
            {visible.active.map((shape, i) =>
              shape.xy ? (
                <circle
                  key={`active-${i}`}
                  cx={shape.xy[0]}
                  cy={shape.xy[1]}
                  r={POINT_RADIUS.active}
                  fill={colorOf.get(shape.props.c) ?? 'var(--color-foreground)'}
                  stroke="var(--color-background)"
                  strokeWidth={0.8}
                />
              ) : (
                <path
                  key={`active-${i}`}
                  d={shape.d}
                  fill="none"
                  stroke={colorOf.get(shape.props.c) ?? 'var(--color-foreground)'}
                  strokeWidth={1.3}
                  strokeLinecap="round"
                />
              ),
            )}
            {visible.opened.map((shape, i) =>
              shape.xy ? (
                <circle
                  key={`opened-${i}`}
                  cx={shape.xy[0]}
                  cy={shape.xy[1]}
                  r={POINT_RADIUS.opened}
                  fill="var(--color-destructive)"
                  stroke="var(--color-background)"
                  strokeWidth={1.5}
                />
              ) : (
                <g key={`opened-${i}`}>
                  <path d={shape.d} fill="none" stroke="var(--color-background)" strokeWidth={5} strokeLinecap="round" />
                  <path d={shape.d} fill="none" stroke="var(--color-destructive)" strokeWidth={2.6} strokeLinecap="round" />
                </g>
              ),
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
            aria-label={isPlaying ? '再生を止める' : `${first}年から再生する`}
          >
            {isPlaying ? <Pause /> : <Play />}
          </Button>
          <Slider
            min={first}
            max={last}
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
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-5 rounded-none bg-destructive" aria-hidden />
            {legend.opened}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block w-5 border-t-2 border-dashed border-foreground" aria-hidden />
            {legend.closed}
          </li>
        </ul>
        {footer}
      </SectionCard>

      <StatTile
        label={`${year}年の${measure.label}${isFiltered ? '（選んだ種別）' : ''}`}
        value={formatNumber(total)}
        unit={measure.unit}
        meta={`前年から ${index > 0 ? formatDiff(total - previous, measure.unit) : '—'}`}
      >
        <NumericTrendChart
          points={years.map((y, i) => ({ year: y, value: visibleTotal[i] ?? 0 }))}
          policy={{ mode: 'zero' }}
          selectedYear={year}
          label={`${scopeName}の${measure.label}`}
          unit={measure.unit}
          formatValue={formatNumber}
        />
        <ChartLegend
          layout="list"
          label="表示する種別"
          items={categories.map((category) => ({
            key: category.code,
            label: category.label,
            color: category.color,
            marker: geometry === 'line' ? 'line' : 'square',
            value: formatValue(series.byCategory[category.code]?.[index] ?? 0, measure.unit),
          }))}
          hiddenKeys={hiddenCodes}
          onToggle={toggleCategory}
        />
        <p className="text-xs text-muted-foreground">種別を押すと、地図・推移・一覧の表示を切り替えられます。</p>
      </StatTile>

      {rankedRows.length > 0 && (
        <SectionCard
          title={`${rowsLabel}の${measure.label}（${year}年）`}
          icon={<ListOrdered />}
          headingAs="h2"
          className="@lg:col-span-3"
        >
          <p className="mb-2 text-xs text-muted-foreground">
            右端は前年からの増減です。{isFiltered && '表示中の種別だけで集計しています。'}
          </p>
          {/* 幅に応じて 1〜3 段に分け、順位は段ごとに上から下へ読む */}
          <ol className="gap-x-6 @md:columns-2 @lg:columns-3">
            {rankedRows.map((row, i) => (
              <li key={row.code} className="break-inside-avoid border-b border-border py-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">{i + 1}</span>
                  <Link href={row.href} className="min-w-0 flex-1 truncate hover:underline">
                    {row.name}
                  </Link>
                  <span className="tabular-nums">{formatValue(row.value, measure.unit)}</span>
                  <span className="w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {index > 0 ? formatDiff(row.value - row.previous, measure.unit) : '—'}
                  </span>
                </div>
                <div className="mt-1 ml-8 h-1 bg-muted" aria-hidden>
                  <div className="h-full bg-primary/60" style={{ width: `${(row.value / maxRowValue) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>
      )}
    </PanelGrid>
  );
}
